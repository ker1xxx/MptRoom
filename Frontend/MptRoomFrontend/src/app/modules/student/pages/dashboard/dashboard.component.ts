import { Component, Input } from '@angular/core';
import {
  Observable,
  switchMap,
  forkJoin,
  map,
  tap,
  BehaviorSubject,
  from,
  catchError,
  of,
  firstValueFrom,
  shareReplay,
  take,
} from 'rxjs';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { GradeViewModel } from '../../../../models/VM/grade.viewmodel';
import { LessonViewModel } from '../../../../models/VM/lesson.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { DashboardBodyComponent } from './components/dashboard-body/dashboard-body.component';
import { CommonModule } from '@angular/common';
import { TaskViewModel } from '../../../../models/VM/task.viewmodel';
import { LoaderService } from '../../../../services/loader.service';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { PostDTO } from '../../../../models/DTO/post.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { DomSanitizer } from '@angular/platform-browser';
import { LessonSupersedeRequestViewModel } from '../../../../models/VM/lesson-supersede-request.viewmodel';
import { LessonSupersedeRequestDTO } from '../../../../models/DTO/lesson-supersede-request.dto';
import { LessonSlotDTO } from '../../../../models/DTO/lesson-slot.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { SupersedeRequestStatus } from '../../../../models/enums/supersede-request-status.enum';

@Component({
  selector: 'student-dashboard',
  imports: [HeaderComponent, DashboardBodyComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  user$!: StudentDTO;
  schedule$ = new BehaviorSubject<LessonViewModel[] | null>(null);
  grades$ = new BehaviorSubject<GradeViewModel[]>([]);
  tasks$ = new BehaviorSubject<TaskViewModel[]>([]); // Здесь уточняем тип

  @Input() supersedeRequests$ = new BehaviorSubject<
    LessonSupersedeRequestViewModel[]
  >([]);

  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    const student = await firstValueFrom(this.apiService.student$);
    if (student) {
      this.user$ = student;
      await this.loadSchedule();
      await this.apiService.saveAvatar(student.personalDataId!, this.sanitizer);
      this.loadTasks();
      this.loadGrades();
      this.loadApprovedSupersedeRequests(); // Добавляем загрузку одобренных замен
    } else window.location.reload();
  }

  private loadApprovedSupersedeRequests() {
    this.apiService
      .get<LessonSupersedeRequestDTO[]>(
        `LessonSupersedeRequest/group/${this.user$.groupId}`
      )
      .pipe(
        map((requests) =>
          requests.filter(
            (request) =>
              request.supersedeRequestStatus === SupersedeRequestStatus.approved
          )
        ),
        switchMap((filteredRequests) =>
          forkJoin(
            filteredRequests.map((request) =>
              this.mapSupersedeRequestToViewModel(request)
            )
          )
        ),
        catchError((error) => {
          console.error('Ошибка загрузки замен:', error);
          return of([]);
        })
      )
      .subscribe((requests) => {
        this.supersedeRequests$.next(requests);
      });
  }

  private loadCommonTasks(): Observable<TaskDTO[]> {
    return this.apiService
      .get<TaskDTO[]>(`Task/student/${this.user$.userId!}`)
      .pipe(
        shareReplay(1) // Кэшируем результат
      );
  }

  private loadGrades() {
    this.loaderService.loadWithCache(this.grades$, () =>
      this.loadCommonTasks().pipe(
        switchMap((tasks) => {
          // Получаем уникальные ID для запросов
          const subjectIds = [...new Set(tasks.map((t) => t.subjectId))];
          const postIds = [...new Set(tasks.map((t) => t.postId))];

          // Создаем запросы для предметов
          const subjectRequests = subjectIds.map((id) =>
            this.apiService.getById<SubjectDTO>('Subject', id).pipe(
              catchError(() =>
                of({
                  subjectId: id,
                  subjectName: 'N/A',
                  hexademicalColor: '#CCC',
                })
              )
            )
          );

          // Создаем запросы для постов
          const postRequests = postIds.map((id) =>
            this.apiService.getById<PostDTO>('Post', id).pipe(
              catchError(() =>
                of({
                  postId: id,
                  postTitle: 'N/A',
                })
              )
            )
          );

          return forkJoin({
            subjects: forkJoin(subjectRequests),
            posts: forkJoin(postRequests),
            tasks: of(tasks),
          });
        }),
        map(({ subjects, posts, tasks }) => {
          // Создаем Map для быстрого доступа
          const subjectMap = new Map(subjects.map((s) => [s.subjectId, s]));
          const postMap = new Map(posts.map((p) => [p.postId, p]));
          return tasks
            .filter((task) => task.mark !== null)
            .slice(0, 4)
            .map((task) => ({
              SidebarColor:
                subjectMap.get(task.subjectId)?.hexademicalColor || '#CCC',
              Subject: subjectMap.get(task.subjectId)?.subjectName || 'N/A',
              Task: postMap.get(task.postId)?.postTitle || 'N/A',
              postId: task.postId,
              courseId: task.courseId,
              Grade: `${task.mark} / ${task.maxMark}`,
              Duedate: task.dueTime,
            }));
        }),
        catchError((error) => {
          console.error('Ошибка загрузки оценок:', error);
          return of([]);
        })
      )
    );
  }

  private formatTeacherName(personalData: any): string {
    if (!personalData) return 'N/A';
    const lastName = personalData.lastname || '';
    const firstNameInitial = personalData.name?.[0]
      ? `${personalData.name[0]}.`
      : '';
    const patronymicInitial = personalData.patronymic?.[0]
      ? ` ${personalData.patronymic[0]}.`
      : '';
    return `${lastName} ${firstNameInitial}${patronymicInitial}`.trim();
  }

  private loadSchedule() {
    this.loaderService.loadWithCache(this.schedule$, () =>
      this.apiService
        .getSchedule()
        .pipe(map((lessons) => this.processAndSortLessons(lessons)))
    );
  }

  private processAndSortLessons(lessons: LessonViewModel[]): LessonViewModel[] {
    const currentWeekType = this.getCurrentWeekType();
    return lessons
      .filter(
        (lesson) =>
          lesson.WeekType === 'any' || lesson.WeekType === currentWeekType
      )
      .sort((a, b) => {
        // Сортировка по дням недели
        const dayComparison =
          this.daysOrder.indexOf(a.DayOfWeek) -
          this.daysOrder.indexOf(b.DayOfWeek);

        // Если дни одинаковые - сортировка по номеру урока
        return dayComparison !== 0
          ? dayComparison
          : a.LessonNumber - b.LessonNumber;
      });
  }

  // Предполагаемая структура (добавьте в код):
  private daysOrder = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  private getCurrentWeekType(): string {
    // Реализация определения текущей недели
    const weekNumber = this.getWeekNumber(new Date());
    return weekNumber % 2 === 0 ? 'even' : 'odd';
  }

  private getWeekNumber(d: Date): number {
    // Реализация расчета номера недели
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
  }

  private loadTasks() {
    if (!this.user$?.userId) return;
    this.loaderService.loadWithCache(this.tasks$, () =>
      this.apiService.get<TaskDTO[]>(`Task/student/${this.user$.userId!}`).pipe(
        switchMap((tasks) => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          const filteredTasks = tasks
            .filter((task) => {
              const dueDate = new Date(task.dueTime);
              return (
                task.taskStatus !== 3 &&
                dueDate >= weekAgo && // Фильтр по дате (не старше недели)
                dueDate >= new Date() // Только будущие даты
              );
            })
            .sort(
              (a, b) =>
                new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime()
            ) // Сортировка по дате
            .slice(0, 5); // Берем первые 5 элементов

          if (filteredTasks.length === 0) {
            return of([]);
          }

          const postIds = filteredTasks.map((t) => t.postId!);
          const teacherIds = filteredTasks.map((t) => t.teacherId);

          return forkJoin({
            subjects: forkJoin(
              filteredTasks.map((task) =>
                this.apiService
                  .getById<SubjectDTO>('Subject', task.subjectId)
                  .pipe(
                    catchError(() =>
                      of({ hexademicalColor: '#CCCCCC', subjectName: 'N/A' })
                    )
                  )
              )
            ),
            posts: forkJoin(
              postIds.map((id) => this.apiService.getById<PostDTO>('Post', id))
            ),
            personalData: forkJoin(
              teacherIds.map((id) =>
                this.apiService.getById<TeacherDTO>('Teacher', id).pipe(
                  switchMap((teacher) =>
                    this.apiService
                      .getById<PersonalDataDTO>(
                        'PersonalData',
                        teacher.personalDataId!
                      )
                      .pipe(
                        catchError(() =>
                          of({ lastname: 'N/A', name: ['N/A'], patronymic: '' })
                        )
                      )
                  ),
                  catchError(() => of({ personalDataId: '' }))
                )
              )
            ),
          }).pipe(
            map(({ subjects, posts, personalData }) =>
              filteredTasks.map((task, index) => ({
                taskId: task.taskId,
                postId: posts[index].postId!,
                courseId: posts[index].courseId,
                sidebarColor: subjects[index]?.hexademicalColor || '#CCCCCC',
                dueTime: task.dueTime,
                subjectName: subjects[index]?.subjectName || 'N/A',
                taskName: posts[index]?.postTitle || 'N/A',
                teacherName: this.formatTeacherName(personalData[index]),
                taskStatus: task.taskStatus,
                mark: task.mark,
                maxMark: task.maxMark,
                description: posts[index].postDescription,
                lastUpdate: task.lastUpdate,
              }))
            )
          );
        }),
        catchError((err) => {
          console.error('Error loading tasks:', err);
          return of([]);
        })
      )
    );
  }

  private mapSupersedeRequestToViewModel(
    dto: LessonSupersedeRequestDTO
  ): Observable<LessonSupersedeRequestViewModel> {
    return this.apiService.getById<TeacherDTO>('Teacher', dto.teacherId).pipe(
      switchMap((teacher) => {
        if (!teacher.personalDataId) {
          throw new Error('У преподавателя отсутствуют персональные данные');
        }

        return forkJoin({
          teacherData: of(teacher),
          personalData: this.apiService.getById<PersonalDataDTO>(
            'PersonalData',
            teacher.personalDataId
          ),
          group: this.apiService.getById<GroupDTO>('Group', dto.groupId),
          subject: this.apiService.getById<SubjectDTO>(
            'Subject',
            dto.subjectId
          ),
          slot: this.apiService.getById<LessonSlotDTO>(
            'LessonSlot',
            dto.lessonSlotId
          ),
        });
      }),
      map(({ teacherData, personalData, group, subject, slot }) => ({
        ...dto,
        teacherName: `${personalData.lastname} ${personalData.name[0]}. ${
          personalData.patronymic?.[0] ?? ''
        }.`,
        groupName: group.groupName,
        subjectName: subject.subjectName,
        lessonSlotName: `${slot.lessonStart} - ${slot.lessonEnd}`,
        requestTime: dto.requestTime,
        dateToSupersede: dto.dateToSupersede,
        hexademicalColor: subject.hexademicalColor,
      })),
      catchError((error) => {
        console.error('Ошибка загрузки данных:', error);
        return of({
          ...dto,
          teacherName: 'Неизвестный преподаватель',
          groupName: 'Группа не найдена',
          subjectName: 'Предмет не найден',
          lessonSlotName: 'Время не указано',
        } as LessonSupersedeRequestViewModel);
      })
    );
  }
}
