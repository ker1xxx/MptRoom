import { Component, Input, OnChanges } from '@angular/core';
import { TaskViewModel } from '../../../../../../../models/VM/task.viewmodel';
import { CourseViewModel } from '../../../../../../../models/VM/course.viewmode';
import { PostViewModel } from '../../../../../../../models/VM/post.viewmodel';
import {
  catchError,
  EMPTY,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { StudentDTO } from '../../../../../../../models/DTO/student.dto';
import { ApiService } from '../../../../../../../services/api.service';
import { StudentViewModel } from '../../../../../../../models/VM/student.viewmodel';
import { GroupDTO } from '../../../../../../../models/DTO/group.dto';
import { PersonalDataDTO } from '../../../../../../../models/DTO/personal-data.dto';
import { TaskAnswerDTO } from '../../../../../../../models/DTO/task-answer.dto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { decodeId } from '../../../../../../../helper/util';
import { TeacherDTO } from '../../../../../../../models/DTO/teacher.dto';
import { PostDTO } from '../../../../../../../models/DTO/post.dto';
import { PostThemeDTO } from '../../../../../../../models/DTO/post-theme.dto';
import { UserBaseDTO } from '../../../../../../../models/DTO/user-base.dto';
import { PostTypeEnum } from '../../../../../../../models/enums/post-type.enum';
import { CourseDTO } from '../../../../../../../models/DTO/course.dto';
import { SubjectDTO } from '../../../../../../../models/DTO/subject.dto';
import { TaskDTO } from '../../../../../../../models/DTO/task.dto';
import { PreviewModalComponent } from '../../preview-modal/preview-modal.component';
import { AdditionalMaterialDTO } from '../../../../../../../models/DTO/additional-material.dto';
import { HeaderComponent } from '../../../../../shared/header/header.component';
import { SidebarMenuComponent } from '../../sidebar-menu/sidebar-menu.component';
import { AvatarModalComponent } from '../../../../../../shared/avatar-modal/avatar-modal.component';
import { RussianDatePipe } from '../../../../../../../helper/RussianDatePipe';
import { TaskStatusEnum } from '../../../../../../../models/enums/task-status.enum';
import { NotificationService } from '../../../../../../../services/notification.service';

@Component({
  selector: 'teacher-marks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PreviewModalComponent,
    HeaderComponent,
    SidebarMenuComponent,
    RussianDatePipe,
  ],
  templateUrl: './marks.component.html',
  styleUrl: './marks.component.scss',
})
export class MarksComponent {
  selectedTask$!: TaskViewModel;
  tasks: TaskViewModel[] = [];
  course$!: CourseViewModel | null;
  post$!: PostViewModel;

  user!: TeacherDTO | null;

  selectedFileId?: number;
  selectedFilePath?: string;

  students: StudentViewModel[] = [];
  taskAnswers: TaskAnswerDTO[] = [];
  assignmentTime: string = '';
  additionalMaterials!: AdditionalMaterialDTO[];

  selectedStudent?: StudentViewModel;
  mark?: number = 0;

  isLoading = true;
  isError = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const courseHash = params.get('courseHash');
          const postHash = params.get('postHash');
          if (!courseHash || !postHash) throw new Error('Invalid params');

          const courseId = decodeId(courseHash);
          const postId = decodeId(postHash);

          return forkJoin({
            user: this.api.teacher$.pipe(take(1)),
            post: this.getPostViewModel(postId),
            course: this.getCourseDetails(courseId),
          });
        }),
        switchMap(({ user, post, course }) => {
          if (!user) {
            this.router.navigate(['/login']);
            return EMPTY;
          }

          this.user = user;
          this.post$ = post;
          this.course$ = course;

          return forkJoin({
            tasks: this.getTasksViewModel(post.id),
            students: this.getStudents(post.groupId),
            answers: this.getTaskAnswers(post.id),
            materials: this.getAdditionalMaterials(post.id),
          });
        })
      )
      .subscribe({
        next: ({ tasks, students, answers, materials }) => {
          this.tasks = tasks;
          this.students = students;
          this.taskAnswers = answers;
          this.additionalMaterials = materials;
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isError = true;
          this.isLoading = false;
        },
      });
  }

  onStudentSelect(student: StudentViewModel) {
    this.selectedStudent = student;
    this.selectedTask$ = this.tasks.filter(
      (t) => t.studentId === student.userId
    )[0];
    this.mark = this.selectedTask$.mark;

    const filteredTaskAnswers = this.taskAnswers.filter(
      (ta) => ta.studentId == this.selectedStudent?.userId
    );
    if (filteredTaskAnswers.length > 0)
      this.assignmentTime =
        filteredTaskAnswers[filteredTaskAnswers.length - 1].assignmentTime;
    else this.assignmentTime = 'Работа не прикреплена';
  }

  get filteredAnswers(): AdditionalMaterialDTO[] {
    if (!this.selectedStudent || !this.taskAnswers || !this.additionalMaterials)
      return [];

    // 1. Получаем все ID материалов из ответов студента
    const studentMaterialIds = this.taskAnswers
      .filter((answer) => answer.studentId === this.selectedStudent!.userId)
      .map((answer) => answer.additionalMaterialId);

    // 2. Фильтруем материалы по найденным ID
    return this.additionalMaterials.filter((material) =>
      studentMaterialIds.includes(material.additionalMaterialId!)
    );
  }

  private getStudents(groupId: number): Observable<StudentViewModel[]> {
    return this.api.get<StudentDTO[]>(`Student/group/${groupId}`).pipe(
      switchMap((dtos) => this.studentsToViewModel(dtos)),
      catchError(() => of([]))
    );
  }

  private getTaskAnswers(postId: number): Observable<TaskAnswerDTO[]> {
    return this.api
      .get<TaskAnswerDTO[]>(`TaskAnswer/post/${postId}`)
      .pipe(catchError(() => of([])));
  }

  private getAdditionalMaterials(
    postId: number
  ): Observable<AdditionalMaterialDTO[]> {
    return this.api
      .get<AdditionalMaterialDTO[]>(`AdditionalMaterial/post/${postId}`)
      .pipe(catchError(() => of([])));
  }

  filterTaskAnswer() {
    this.taskAnswers.filter(
      (ta) => ta.studentId == this.selectedStudent?.userId
    );
  }

  getPostViewModel(postId: number): Observable<PostViewModel> {
    return this.api.getById<PostDTO>('post', postId).pipe(
      switchMap((post: PostDTO) =>
        forkJoin({
          theme: this.getPostThemed(post.postThemeId),
          user: this.getTeacher(post.userId),
          course: this.getCourseDetails(post.courseId),
        }).pipe(
          switchMap(({ theme, user, course }) =>
            this.getPersonalData(user.personalDataId!).pipe(
              map((personal) => {
                const author = `${personal.lastname} ${personal.name} ${
                  personal.patronymic ?? ''
                }`.trim();

                const viewModel: PostViewModel = {
                  id: post.postId!,
                  title: post.postTitle,
                  description: post.postDescription,
                  theme: theme.postThemeText,
                  type: post.postType,
                  typeName: this.getPostTypeLabel(post.postType),
                  date: post.created,
                  author,
                  authorId: user.userId!,
                  courseId: post.courseId,
                  courseName: course!.courseName,
                  groupId: course!.groupId!,
                  subjectId: course!.subjectId,
                };

                return viewModel;
              })
            )
          )
        )
      )
    );
  }

  getTasksViewModel(postId: number): Observable<TaskViewModel[]> {
    return this.api.get<TaskDTO[]>(`task/post/${postId}`).pipe(
      switchMap((tasks) => {
        // Если нет задач - возвращаем пустой массив
        if (!tasks?.length) return of([]);

        // Получаем дополнительные данные для всех задач
        return forkJoin(
          tasks.map((task) =>
            this.getPostForTask(task.postId).pipe(
              map((post) => ({
                task,
                post,
              }))
            )
          )
        ).pipe(
          map((results) =>
            results.map(({ task, post }) => this.mapSingleTask(task, post))
          )
        );
      }),
      catchError(() => of([])) // Обрабатываем возможные ошибки
    );
  }

  private getPostForTask(postId: number): Observable<PostDTO> {
    return this.api.getById<PostDTO>(`post`, postId);
  }

  private mapSingleTask(task: TaskDTO, post: PostDTO): TaskViewModel {
    return {
      taskId: task.taskId,
      postId: task.postId!,
      sidebarColor: this.course$!.hexademicalColor,
      dueTime: task.dueTime,
      subjectName: this.course$!.subjectName,
      teacherName: this.course$!.teacherName,
      taskName: post.postTitle,
      taskStatus: task.taskStatus,
      mark: task.mark ?? 0,
      maxMark: task.maxMark,
      description: post.postDescription,
      lastUpdate: task.lastUpdate,
      studentId: task.studentId,
    };
  }

  getCourseDetails(courseId: number): Observable<CourseViewModel | null> {
    if (!courseId || courseId <= 0) {
      return of(null);
    }

    return this.api.get<CourseDTO>(`Course/${courseId}`).pipe(
      catchError(() => of(null)),
      switchMap((course) => {
        if (!course) {
          return of(null);
        }

        const group$ = this.api.get<GroupDTO>(`group/${course.groupId}`);
        const subject$ = this.api.get<SubjectDTO>(
          `subject/${course.subjectId}`
        );
        const teacherData$ = this.api
          .get<TeacherDTO>(`teacher/${course.teacherId}`)
          .pipe(
            switchMap((teacher) =>
              this.api
                .get<PersonalDataDTO>(`personaldata/${teacher.personalDataId}`)
                .pipe(
                  map((personalData) => ({
                    teacherId: course.teacherId,
                    personalData,
                  })),
                  catchError(() => of(null))
                )
            ),
            catchError(() => of(null))
          );

        return forkJoin({
          group: group$,
          subject: subject$,
          teacherData: teacherData$,
        }).pipe(
          map(({ group, subject, teacherData }) => {
            if (!group || !subject || !teacherData) {
              return null;
            }

            const courseViewModel: CourseViewModel = {
              courseId: course.courseId,
              courseName: subject.subjectName,
              groupId: course.groupId,
              groupName: group.groupName,
              subjectId: subject.subjectId!,
              subjectName: subject.subjectName,
              teacherId: course.teacherId,
              teacherName: teacherData.personalData
                ? `${teacherData.personalData.lastname} ${
                    teacherData.personalData.name[0]
                  }. ${teacherData.personalData.patronymic?.[0] ?? ''}`
                : 'Преподаватель не указан',
              hexademicalColor: subject.hexademicalColor,
            };

            return courseViewModel;
          })
        );
      })
    );
  }

  getPostTypeLabel(type: PostTypeEnum): string {
    switch (type) {
      case PostTypeEnum.Post:
        return 'Публикация';
      case PostTypeEnum.AdditionalMaterials:
        return 'Дополнительные материалы';
      case PostTypeEnum.Survey:
        return 'Опрос';
      case PostTypeEnum.Task:
        return 'Задание';
      default:
        return 'Неизвестно';
    }
  }

  getTaskStatusLabel(type: TaskStatusEnum): string {
    switch (type) {
      case TaskStatusEnum.Appointed:
        return 'Назначено';
      case TaskStatusEnum.Submitted:
        return 'Прикреплено';
      case TaskStatusEnum.ReturnedWithMark:
        return 'Возвращено с оценкой';
      case TaskStatusEnum.DeadlineMissed:
        return 'Пропущен срок сдачи';
      default:
        return 'Неизвестно';
    }
  }

  getPostThemed(themeId: number): Observable<PostThemeDTO> {
    return this.api.get<PostThemeDTO>(`postTheme/${themeId}`);
  }

  getTeacher(userId: number): Observable<UserBaseDTO> {
    return this.api.get<TeacherDTO>(`Teacher/${userId}`);
  }

  getPersonalData(personalDataId: number): Observable<PersonalDataDTO> {
    return this.api.get<PersonalDataDTO>(`personalData/${personalDataId}`);
  }

  private studentsToViewModel(
    students: StudentDTO[]
  ): Observable<StudentViewModel[]> {
    const requests = students.map((dto) =>
      forkJoin({
        personalData: this.api.getById<PersonalDataDTO>(
          'PersonalData',
          dto.personalDataId!
        ),
        groupData: this.api.getById<GroupDTO>('Group', dto.groupId),
      }).pipe(
        map(({ personalData, groupData }) => ({
          userId: dto.userId!,
          name: personalData.name,
          lastname: personalData.lastname,
          patronymic: personalData.patronymic || '',
          phoneNumber: personalData.phoneNumber,
          email: personalData.email,
          login: '', // можно дополнить, если есть
          groupId: dto.groupId,
          groupName: groupData.groupName,
          avatarAbsoluteUri: personalData.avatarAbsoluteUri,
        }))
      )
    );

    return forkJoin(requests);
  }

  openPreview(fileId: number, filepath: string) {
    this.api.getAdditionalMaterials(fileId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.selectedFilePath = url;
        this.selectedFileId = fileId;
      },
    });
  }
  closePreview() {
    this.selectedFileId = undefined;
    this.selectedFilePath = undefined;
  }

  getFileName(uri: string): string | undefined {
    if (!uri) return undefined;
    const fileName = uri.split('\\').pop(); // Получаем последнее слово в пути
    if (!fileName) return undefined;

    return fileName;
  }

  onSubmit() {
    if (this.mark && 0 < this.mark && this.mark <= this.selectedTask$.maxMark) {
      const taskDTO: TaskDTO = {
        taskId: this.selectedTask$.taskId,
        postId: this.selectedTask$.postId!,
        dueTime: this.selectedTask$.dueTime,
        subjectId: this.course$!.subjectId!,
        teacherId: this.user!.userId!,
        courseId: this.course$!.courseId!,
        taskStatus: TaskStatusEnum.ReturnedWithMark,
        studentId: this.selectedTask$.studentId!,
        mark: this.mark,
        maxMark: this.selectedTask$.maxMark,
        lastUpdate: this.selectedTask$.lastUpdate,
      };
      this.api
        .put<TaskDTO>('Task', taskDTO, this.selectedTask$.taskId!)
        .subscribe({
          next: () => {
            this.notificationService.show(
              '✅ Оценка успешно сохранена',
              'success'
            );
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          },
          error: (err) => {
            console.error(err);
            this.notificationService.show(
              '❌ Ошибка при сохранении оценки',
              'error'
            );
          },
        });
    } else {
      this.notificationService.show('❌ Введите корректную оценку ', 'error');
    }
  }
}
