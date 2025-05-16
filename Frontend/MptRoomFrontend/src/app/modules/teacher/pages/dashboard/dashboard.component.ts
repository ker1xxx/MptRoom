import { Component, Input } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import {
  BehaviorSubject,
  switchMap,
  forkJoin,
  map,
  catchError,
  of,
  from,
  firstValueFrom,
  Observable,
} from 'rxjs';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { PostDTO } from '../../../../models/DTO/post.dto';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { GradeViewModel } from '../../../../models/VM/grade.viewmodel';
import { LessonViewModel } from '../../../../models/VM/lesson.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { LoaderService } from '../../../../services/loader.service';
import { TeacherTaskViewModel } from '../../../../models/VM/teacher-task.viewmodel';
import { TaskStatusEnum } from '../../../../models/enums/task-status.enum';
import { TeacherDashboardBodyComponent } from './components/teacher-dashboard-body/teacher-dashboard-body.component';
import { TaskAnswerDTO } from '../../../../models/DTO/task-answer.dto';
import { DomSanitizer } from '@angular/platform-browser';
import { LessonSupersedeRequestViewModel } from '../../../../models/VM/lesson-supersede-request.viewmodel';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { LessonSlotDTO } from '../../../../models/DTO/lesson-slot.dto';
import { LessonSupersedeRequestDTO } from '../../../../models/DTO/lesson-supersede-request.dto';
import { SupersedeRequestStatus } from '../../../../models/enums/supersede-request-status.enum';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'teacher-dashboard',
  imports: [HeaderComponent, TeacherDashboardBodyComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class TeacherDashboardComponent {
  user$!: TeacherDTO;
  schedule$ = new BehaviorSubject<LessonViewModel[] | null>(null);
  tasks$ = new BehaviorSubject<TeacherTaskViewModel[]>([]); // Здесь уточняем тип
  @Input() supersedeRequests$ = new BehaviorSubject<
    LessonSupersedeRequestViewModel[]
  >([]);

  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    // Запрашиваем задания и оценки
    const teacher = await firstValueFrom(this.apiService.teacher$);
    if (teacher) {
      this.user$ = teacher;
      await this.loadSchedule();
      await this.apiService.saveAvatar(teacher.personalDataId!, this.sanitizer);
      this.loadTasks();
      this.loadApprovedSupersedeRequests(); // Добавляем загрузку одобренных замен
    } else {
      window.location.reload();
    }
  }

  private loadApprovedSupersedeRequests() {
    this.apiService
      .get<LessonSupersedeRequestDTO[]>(
        `LessonSupersedeRequest/teacher/${this.user$.userId}`
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

  private loadSchedule() {
    this.loaderService.loadWithCache(this.schedule$, () =>
      this.apiService
        .getTeacherSchedule()
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
      this.apiService
        .get<TaskAnswerDTO[]>(
          `TaskAnswer/teacher/assigned/${this.user$.userId!}`
        )
        .pipe(
          switchMap((taskAnswers) => {
            if (taskAnswers.length === 0) return of([]);
            taskAnswers = Array.from(
              new Map(
                taskAnswers
                  .filter((ta) => ta.taskId)
                  .map((ta) => [ta.taskId, ta])
              ).values()
            );
            const postIds = taskAnswers.map((t) => t.taskId!);
            const studentIds = taskAnswers.map((t) => t.studentId);

            // Загрузка TaskDTO по паре postId + studentId
            const taskDtos$ = forkJoin(
              taskAnswers.map((task) =>
                this.apiService.getById<TaskDTO>(`Task`, task.taskId).pipe(
                  catchError(() =>
                    of({
                      taskId: task.taskId,
                      dueTime: '',
                      subjectId: 0,
                      teacherId: 0,
                      courseId: 0,
                      taskStatus: TaskStatusEnum.Appointed,
                      studentId: task.studentId,
                      maxMark: 0,
                      mark: undefined,
                      lastUpdate: '',
                    } as TaskDTO)
                  )
                )
              )
            );

            return taskDtos$.pipe(
              switchMap((taskDtos) => {
                const subjectIds = taskDtos.map((t) => t.subjectId);

                return forkJoin({
                  subjects: forkJoin(
                    subjectIds.map((id) =>
                      this.apiService.getById<SubjectDTO>('Subject', id).pipe(
                        catchError(() =>
                          of({
                            hexademicalColor: '#CCCCCC',
                            subjectName: 'N/A',
                          } as SubjectDTO)
                        )
                      )
                    )
                  ),
                  posts: forkJoin(
                    postIds.map((id) =>
                      this.apiService.getById<PostDTO>('Post', id).pipe(
                        catchError(() =>
                          of({
                            postTitle: 'N/A',
                            postDescription: 'Описание отсутствует',
                          } as PostDTO)
                        )
                      )
                    )
                  ),
                  personalData: forkJoin(
                    studentIds.map((id) =>
                      this.apiService.getById<StudentDTO>('Student', id).pipe(
                        switchMap((student) =>
                          this.apiService
                            .getById<PersonalDataDTO>(
                              'PersonalData',
                              student.personalDataId!
                            )
                            .pipe(
                              catchError(() =>
                                of({
                                  lastname: 'N/A',
                                  name: 'N/A',
                                  patronymic: '',
                                } as PersonalDataDTO)
                              )
                            )
                        ),
                        catchError(() =>
                          of({
                            lastname: 'N/A',
                            name: 'N/A',
                            patronymic: '',
                          } as PersonalDataDTO)
                        )
                      )
                    )
                  ),
                  students: forkJoin(
                    studentIds.map((id) =>
                      this.apiService
                        .getById<StudentDTO>('Student', id)
                        .pipe(catchError(() => of()))
                    )
                  ),
                }).pipe(
                  map(({ subjects, posts, personalData, students }) =>
                    taskAnswers.map((task, index): TeacherTaskViewModel => {
                      const taskDto = taskDtos[index];
                      return {
                        taskId: task.taskId,
                        sidebarColor:
                          subjects[index]?.hexademicalColor || '#CCCCCC',
                        dueTime: taskDto.dueTime
                          ? new Date(taskDto.dueTime).toISOString()
                          : '',
                        courseId: posts[index].courseId,
                        postId: posts[index].postId!,
                        courseName: `${
                          subjects[index]?.subjectName || 'N/A'
                        } · ${students[index]?.groupId || 'N/A'}`,
                        studentName: this.formatStudentName(
                          personalData[index]
                        ),
                        subjectName: subjects[index].subjectName,
                        taskName: posts[index]?.postTitle || 'N/A',
                        taskStatus: taskDto.taskStatus,
                        mark: taskDto.mark,
                        maxMark: taskDto.maxMark,
                        description:
                          posts[index]?.postDescription ||
                          'Описание отсутствует',
                        assingmentDate: task.assignmentTime,
                      };
                    })
                  )
                );
              })
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

  private formatStudentName(personalData: PersonalDataDTO): string {
    const parts = [
      personalData?.lastname || '',
      personalData?.name + ' ' || '',
      personalData?.patronymic ?? '',
    ];
    return parts.filter((p) => p).join(' ') || 'Неизвестный студент';
  }
}
