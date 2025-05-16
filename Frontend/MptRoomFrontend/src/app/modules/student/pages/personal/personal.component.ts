import { Component, OnDestroy, signal } from '@angular/core';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { ApiService } from '../../../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs/internal/Observable';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import {
  catchError,
  combineLatest,
  firstValueFrom,
  forkJoin,
  from,
  map,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import { StudentViewModel } from '../../../../models/VM/student.viewmodel';
import { AuthorizationDataDTO } from '../../../../models/DTO/authorization-data.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { TaskViewModel } from '../../../../models/VM/task.viewmodel';
import { PostDTO } from '../../../../models/DTO/post.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { CloseTaskCardComponent } from '../dashboard/components/close-task-card/close-task-card.component';
import { CourseDTO } from '../../../../models/DTO/course.dto';
import { HeaderComponent } from '../../shared/header/header.component';
import { TaskStatusEnum } from '../../../../models/enums/task-status.enum';
import { AvatarModalComponent } from '../../../shared/avatar-modal/avatar-modal.component';
import { SafeResourceUrl } from '@angular/platform-browser';
import { ChartData, ChartOptions, ChartType } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-personal',
  imports: [
    CommonModule,
    FormsModule,
    CloseTaskCardComponent,
    HeaderComponent,
    AvatarModalComponent,
    NgChartsModule,
  ],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.scss',
})
export class PersonalComponent implements OnDestroy {
  student!: StudentDTO;
  subjects$!: Observable<SubjectDTO[]>;
  unsubmittedWorksCount$!: Observable<number>;
  unsubmittedTasks$!: Observable<TaskViewModel[] | null>;
  tasks$!: Observable<TaskDTO[]>;
  studentVM$!: Observable<StudentViewModel>;
  avatarUrl: SafeResourceUrl | string =
    'assets/images/user_icon_not_found_100px.png';
  showAvatarModal = false;

  private destroy$ = new Subject<void>();

  averageGrade: number | null = null;
  newPassword: string = '';
  selectedSubjectId: number | null = null;

  public radarChartType: ChartType = 'radar';

  subjectsWithAverages$!: Observable<
    { subjectName: string; average: number; hexademicalColor: string }[]
  >;

  chartData$!: Observable<ChartData<'radar'>>;

  chartOptions: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutElastic',
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          backdropColor: 'transparent',
          color: '#9CA3AF', // Светло-серый текст
          font: {
            family: 'Inter, sans-serif',
            size: 12,
          },
        },
        pointLabels: {
          color: '#111827', // Тёмный текст
          font: {
            size: 16,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(107, 114, 128, 0.2)', // Светло-серые линии
          circular: true,
        },
        angleLines: {
          color: 'rgba(107, 114, 128, 0.3)',
        },
      },
    },
    layout: {
      padding: {
        top: 20,
        bottom: 20,
      },
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#3B82F6',
        borderWidth: 1,
        padding: 10,
      },
      legend: {
        display: false,
      },
    },
  };

  constructor(
    private api: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.getSubjects();
    this.api.student$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (student) => {
        if (!student) return;

        this.student = student;
        this.tasks$ = this.api.get<TaskDTO[]>(`Task/student/${student.userId}`);
        this.api.avatarUrlCache.subscribe((url) => {
          this.avatarUrl = url;
        });
        this.studentVM$ = this.convertToViewModels(student);
        this.unsubmittedTasks$ = this.getUnsubmitterWorks();
        this.unsubmittedWorksCount$ = this.getUnsubmittedWorksCount();
        this.subjectsWithAverages$ = this.subjects$.pipe(
          switchMap((subjects) =>
            combineLatest(
              subjects.map((subject) =>
                this.calculateAverageForSubject(subject.subjectId!).pipe(
                  map((avg) => ({
                    subjectName: subject.subjectName,
                    average: avg,
                    hexademicalColor: subject.hexademicalColor,
                  }))
                )
              )
            )
          )
        );
        this.chartData$ = this.subjectsWithAverages$.pipe(
          map((subjects): ChartData<'radar', number[], string> => {
            const colors = subjects.map((s) => s.hexademicalColor);

            return {
              labels: subjects.map((s) => s.subjectName),
              datasets: [
                {
                  label: 'Средняя оценка',
                  data: subjects.map((s) => s.average),
                  borderColor: colors, // Цвет линий между точками
                  pointBackgroundColor: colors, // Цвет точек
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: colors,
                  fill: true,
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderWidth: 2,
                },
              ],
            };
          })
        );
      },
      error: (err) => console.error('Student load error:', err),
    });
  }

  getUnsubmittedWorksCount(): Observable<number> {
    return this.tasks$.pipe(
      map(
        (tasks) =>
          tasks.filter((t) => t.taskStatus == TaskStatusEnum.DeadlineMissed)
            .length
      )
    );
  }

  getUnsubmitterWorks(): Observable<TaskViewModel[] | null> {
    return this.tasks$.pipe(
      switchMap((tasks) => {
        // Фильтруем задачи со статусом 3 и берем первые 10
        const filteredTasks = tasks
          .filter((task) => task.taskStatus === 4 || task.taskStatus === 1)
          .slice(0, 5);

        if (filteredTasks.length === 0) {
          return of([]); // Возвращаем пустой массив сразу
        }

        // Подготовка данных для параллельных запросов
        const requests = filteredTasks.map((task) =>
          forkJoin({
            subject: this.api
              .getById<SubjectDTO>('Subject', task.subjectId)
              .pipe(
                catchError(() =>
                  of({
                    hexademicalColor: '#CCCCCC',
                    subjectName: 'N/A',
                  } as SubjectDTO)
                )
              ),
            post: this.api.getById<PostDTO>('Post', task.postId!),
            teacher: this.api
              .getById<TeacherDTO>('Teacher', task.teacherId)
              .pipe(
                switchMap((teacher) =>
                  this.api
                    .getById<PersonalDataDTO>(
                      'PersonalData',
                      teacher.personalDataId!
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
                catchError(() => of(null))
              ),
          })
        );

        return forkJoin(requests).pipe(
          map((results) =>
            results.map((result, index) => ({
              postId: result.post.postId!,
              sidebarColor: result.subject?.hexademicalColor || '#CCCCCC',
              dueTime: filteredTasks[index].dueTime,
              subjectName: result.subject?.subjectName || 'N/A',
              taskName: result.post?.postTitle || 'N/A',
              teacherName: result.teacher
                ? `${result.teacher.lastname} ${result.teacher.name}`
                : 'N/A',
              taskStatus: filteredTasks[index].taskStatus,
              mark: filteredTasks[index].mark,
              maxMark: filteredTasks[index].maxMark,
              description: result.post?.postDescription,
              lastUpdate: filteredTasks[index].lastUpdate,
            }))
          )
        );
      }),
      catchError((err) => {
        console.error('Error loading tasks:', err);
        return of(null);
      })
    );
  }

  getSubjects() {
    this.subjects$ = this.api.get<CourseDTO[]>('course').pipe(
      switchMap((courses) => {
        const subjectIds = [
          ...new Set(
            courses
              .map((course) => course.subjectId)
              .filter((id): id is number => !!id)
          ),
        ];

        if (subjectIds.length === 0) {
          return of([]); // Если нет предметов
        }

        return forkJoin(
          subjectIds.map((id) =>
            this.api
              .getById<SubjectDTO>('Subject', id)
              .pipe(catchError(() => of(undefined)))
          )
        ).pipe(map((subjects) => subjects.filter((s) => !!s) as SubjectDTO[]));
      }),
      catchError(() => of([]))
    );
  }

  getTasks() {
    this.tasks$ = this.api.get<TaskDTO[]>(
      `Task/student/${this.student.userId}`
    );
  }

  calculateGeneralAverage(): Observable<number> {
    return this.tasks$.pipe(
      map((tasks) => {
        // Фильтруем задачи по subjectId и статусу
        const filteredTasks = tasks.filter((task) => task.taskStatus > 2);

        // Проверяем наличие подходящих задач
        if (filteredTasks.length === 0) {
          return 0; // или можно выбросить ошибку, если нужно
        }

        // Суммируем оценки
        const total = filteredTasks.reduce(
          (sum, task) => sum + (task.mark ?? 0),
          0
        );

        // Вычисляем среднее значение
        return total / filteredTasks.length;
      })
    );
  }

  getSubjectsWithAverages() {
    this.subjectsWithAverages$ = this.subjects$.pipe(
      switchMap((subjects) =>
        combineLatest(
          subjects.map((subject) =>
            this.calculateAverageForSubject(subject.subjectId!).pipe(
              map((avg) => ({
                subjectName: subject.subjectName,
                average: avg,
                hexademicalColor: subject.hexademicalColor,
              }))
            )
          )
        )
      )
    );
  }

  calculateAverageForSubject(subjectId: number): Observable<number> {
    return this.tasks$.pipe(
      map((tasks) => {
        const filteredTasks = tasks.filter(
          (task) => task.subjectId === subjectId && task.taskStatus > 2
        );

        if (filteredTasks.length === 0) {
          return 0; // или ошибка, если нужно
        }

        const total = filteredTasks.reduce(
          (sum, task) => sum + (task.mark ?? 0),
          0
        );

        return total / filteredTasks.length;
      })
    );
  }

  async changePassword() {
    if (!this.newPassword.trim()) return;
    const student = await firstValueFrom(this.studentVM$);
    const authorizationDataDTO: AuthorizationDataDTO = {
      authorizationDataId: student.authorizationDataId!,
      login: student.login,
      password: this.newPassword,
    };
    this.api
      .put(
        'AuthorizationData',
        authorizationDataDTO,
        authorizationDataDTO.authorizationDataId!
      )
      .subscribe({
        next: () => {
          this.notificationService.show(
            '✅ Аватар успешно обновлён',
            'success'
          );
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          this.newPassword = '';
        },
        error: (err) => {
          console.error(err);
          this.notificationService.show(
            '❌ Ошибка при загрузке аватара',
            'error'
          );
        },
      });
  }

  onAvatarChange() {
    this.showAvatarModal = true;
  }

  onAvatarModalClosed() {
    this.showAvatarModal = false;
    // Перезагрузить аватарку (если нужно)
  }

  private convertToViewModels(dto: StudentDTO): Observable<StudentViewModel> {
    return forkJoin({
      personalData: this.api.getById<PersonalDataDTO>(
        'PersonalData',
        dto.personalDataId!
      ),
      authData: this.api.getById<AuthorizationDataDTO>(
        'AuthorizationData',
        dto.authorizationDataId!
      ),
      groupData: this.api.getById<GroupDTO>('Group', dto.groupId),
    }).pipe(
      map(({ personalData, authData, groupData }) => ({
        userId: dto.userId!,
        name: personalData.name,
        lastname: personalData.lastname,
        patronymic: personalData.patronymic || '',
        phoneNumber: personalData.phoneNumber,
        email: personalData.email,
        login: authData.login,
        password: authData.password,
        authorizationDataId: authData.authorizationDataId,
        groupId: dto.groupId,
        groupName: groupData.groupName,
        avatarAbsoluteUri: personalData.avatarAbsoluteUri,
      }))
    );
  }

  ngOnDestroy(): void {
    if (this.avatarUrl && typeof this.avatarUrl === 'string') {
      URL.revokeObjectURL(this.avatarUrl);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
