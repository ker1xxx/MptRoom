import { Component } from '@angular/core';
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

  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService
  ) {}

  async ngOnInit() {
    // Запрашиваем расписание
    await this.loadSchedule();
    // Запрашиваем задания и оценки
    await this.apiService.student$.subscribe((student) => {
      if (student) {
        this.user$ = student;
        console.log('Пользователь загружен:', this.user$);
        this.loadTasks();
        this.loadGrades();
      }
    });
  }

  private loadGrades() {
    console.log(
      'Запрос на загрузку оценок для пользователя:',
      this.user$.userId
    );

    if (!this.user$?.userId) return;

    this.loaderService.loadWithCache(this.grades$, () =>
      this.apiService.get<TaskDTO[]>(`Task/student/${this.user$.userId!}`).pipe(
        switchMap((tasks) => {
          console.log('Полученные задания:', tasks); // Логируем задания, которые пришли от API

          const subjectRequests = tasks.map((task) =>
            this.apiService.getById<SubjectDTO>('Subject', task.subjectId!)
          );
          const postRequests = tasks.map((task) =>
            this.apiService.getById<PostDTO>('Post', task.postId!)
          );

          return forkJoin([
            forkJoin(subjectRequests),
            forkJoin(postRequests),
          ]).pipe(
            map(([subjects, posts]) => {
              const grades = tasks.map((task, index) => ({
                SidebarColor: subjects[index].hexademicalColor,
                Subject: subjects[index].subjectName,
                Task: posts[index].postTitle,
                Grade: task.mark
                  ? `${task.mark} / ${task.maxMark}`
                  : `0 / ${task.maxMark}`,
                Duedate: task.dueTime,
              }));

              console.log('Загруженные оценки:', grades); // Логируем оценки перед отправкой в grades$
              this.grades$.next(grades); // Обновляем поток grades$
              return grades;
            })
          );
        }),
        catchError((error) => {
          console.error('Ошибка при загрузке оценок:', error);
          return of([]); // Возвращаем пустой массив в случае ошибки
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
          const filteredTasks = tasks.filter((task) => task.taskStatus !== 3);
          const postIds = filteredTasks.map((t) => t.postId!);
          const teacherIds = filteredTasks.map((t) => t.teacherId);
          if (filteredTasks.length === 0) {
            return of([]); // Возвращаем пустой массив сразу
          }

          return forkJoin({
            subjects: forkJoin(
              postIds.map((id) =>
                from(this.apiService.getById<SubjectDTO>('Subject', id)).pipe(
                  catchError(() =>
                    of({ hexademicalColor: '#CCCCCC', subjectName: 'N/A' })
                  )
                )
              )
            ),
            posts: forkJoin(
              postIds.map((id) =>
                from(this.apiService.getById<PostDTO>('Post', id)).pipe(
                  catchError(() => of({ postTitle: 'N/A' }))
                )
              )
            ),
            personalData: forkJoin(
              teacherIds.map((id) =>
                from(this.apiService.getById<TeacherDTO>('Teacher', id)).pipe(
                  switchMap((teacher) =>
                    from(
                      this.apiService.getById<PersonalDataDTO>(
                        'PersonalData',
                        teacher.personalDataId!
                      )
                    ).pipe(
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
                sidebarColor: subjects[index]?.hexademicalColor || '#CCCCCC',
                dueTime: task.dueTime,
                subjectName: subjects[index]?.subjectName || 'N/A',
                taskName: posts[index]?.postTitle || 'N/A',
                teacherName: this.formatTeacherName(personalData[index]),
                taskStatus: task.taskStatus,
              }))
            )
          );
        }),
        catchError((err) => {
          console.error('Error loading tasks:', err);
          return of([]); // Пустой массив в случае ошибки
        })
      )
    );
  }
}
