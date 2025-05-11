import { Component, HostListener, ViewChild } from '@angular/core';
import { decodeId, encodeId } from '../../../../../helper/util';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Observable,
  Subject,
  firstValueFrom,
  switchMap,
  forkJoin,
  map,
  of,
  catchError,
  BehaviorSubject,
  from,
} from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { CourseDTO } from '../../../../../models/DTO/course.dto';
import { GroupDTO } from '../../../../../models/DTO/group.dto';
import { PersonalDataDTO } from '../../../../../models/DTO/personal-data.dto';
import { PostThemeDTO } from '../../../../../models/DTO/post-theme.dto';
import { PostDTO } from '../../../../../models/DTO/post.dto';
import { StudentDTO } from '../../../../../models/DTO/student.dto';
import { SubjectDTO } from '../../../../../models/DTO/subject.dto';
import { TeacherDTO } from '../../../../../models/DTO/teacher.dto';
import { UserBaseDTO } from '../../../../../models/DTO/user-base.dto';
import { PostTypeEnum } from '../../../../../models/enums/post-type.enum';
import { CourseViewModel } from '../../../../../models/VM/course.viewmode';
import { PostViewModel } from '../../../../../models/VM/post.viewmodel';
import { ApiService } from '../../../../../services/api.service';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { HeaderComponent } from '../../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { FormGroupDirective, FormsModule } from '@angular/forms';
import { TaskCardComponent } from './task-card/task-card.component';
import { AdditionalMaterialCardComponent } from './additional-material-card/additional-material-card.component';
import { PostHeaderComponent } from './post-header/post-header.component';
import { SurveyCardComponent } from './survey-card/survey-card.component';
import { TaskDTO } from '../../../../../models/DTO/task.dto';
import { TaskStatusEnum } from '../../../../../models/enums/task-status.enum';
import { PostModalComponent } from './post-modal/post-modal.component';
import { PostContentComponent } from './helper/PostContentComponent';
import { AdditionalMaterialDTO } from '../../../../../models/DTO/additional-material.dto';
import { SurveyOptionDTO } from '../../../../../models/DTO/survey-option.dto';
import { NotificationService } from '../../../../../services/notification.service';
import { CommentDTO } from '../../../../../models/DTO/comment.dto';
import { CommentViewModel } from '../../../../../models/VM/comment.viewmodel';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RussianDatePipe } from '../../../../../helper/RussianDatePipe';

@Component({
  selector: 'teacher-post-detail',
  imports: [
    SidebarMenuComponent,
    HeaderComponent,
    CommonModule,
    FormsModule,
    TaskCardComponent,
    AdditionalMaterialCardComponent,
    PostHeaderComponent,
    SurveyCardComponent,
    PostModalComponent,
    RussianDatePipe,
  ],
  animations: [
    trigger('popupAnimation', [
      state(
        'void',
        style({
          opacity: 0,
          transform: 'translateY(-10px)',
        })
      ),
      state(
        '*',
        style({
          opacity: 1,
          transform: 'translateY(0)',
        })
      ),
      transition('void <=> *', animate('200ms ease-in-out')),
    ]),
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent {
  post$!: PostViewModel;
  course$?: Observable<CourseViewModel | null>;
  user!: TeacherDTO | null;
  postType = PostTypeEnum; // чтобы использовать в шаблоне
  isLoading = true;

  students!: StudentDTO[];

  isModalOpen: boolean = false;

  @ViewChild(PostModalComponent) postModal!: PostModalComponent;
  @ViewChild('postContent') postContentComponent!: PostContentComponent;

  postThemes!: PostThemeDTO[];
  postDTO!: PostDTO;

  TaskDTO?: TaskDTO;
  SurveyOptions?: SurveyOptionDTO[];
  AdditionalMaterials?: AdditionalMaterialDTO[];

  Comments: CommentViewModel[] = [];
  selectedCommentId: number | null = null;
  newCommentText: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private notificationService: NotificationService,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    try {
      const postHash = this.route.snapshot.paramMap.get('postHash');
      if (!postHash) throw new Error('Post hash not found');

      const postId = decodeId(postHash);

      // 1. Подгружаем студента
      this.user = await firstValueFrom(this.api.teacher$);
      if (!this.user) {
        this.router.navigate(['/login']);
        return;
      }
      this.getPostViewModel(postId).subscribe((post) => {
        this.post$ = post;
        if (post.authorId === this.user?.userId) {
          this.course$ = this.getCourseDetails(this.post$.courseId);
          this.isLoading = false;
          this.api
            .get<PostThemeDTO[]>(`PostTheme/course/${post.courseId}`)
            .subscribe((themes) => {
              this.postThemes = themes;
            });
          this.getStudentsForCourse();
          this.getComments().subscribe((comments) => {
            this.CommentToViewModel(comments).subscribe(
              (commentvm) => (this.Comments = commentvm)
            );
          });
        } else this.router.navigate(['/404']);
      });
    } catch (error) {
      console.error(error);
      this.notificationService.show('❌ Ошибка при загрузке поста ', 'error');
      this.router.navigate(['/404']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

  getPostViewModel(postId: number): Observable<PostViewModel> {
    return this.api.getById<PostDTO>('post', postId).pipe(
      switchMap((post: PostDTO) =>
        forkJoin({
          theme: this.getPostThemed(post.postThemeId),
          user: this.getTeacher(post.userId),
          course: this.getCourseDetails(post.courseId), // вместо подписки на course$
        }).pipe(
          switchMap(({ theme, user, course }) =>
            this.getPersonalData(user.personalDataId!).pipe(
              map((personal) => {
                const author = `${personal.lastname} ${personal.name} ${
                  personal.patronymic ?? ''
                }`.trim();
                this.postDTO = post;
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

  async onEditTask() {
    const extraData = this.postContentComponent?.getExtraPostData();

    switch (this.postDTO.postType) {
      case PostTypeEnum.Task:
        this.TaskDTO = extraData;
        break;
      case PostTypeEnum.Survey:
        this.SurveyOptions = extraData;
        break;
      case PostTypeEnum.AdditionalMaterials:
        this.AdditionalMaterials = extraData;
        break;
    }

    this.isModalOpen = true;
  }

  onCancel(): void {
    this.isModalOpen = false;
  }

  async onSavePost(postData: any): Promise<void> {
    const isNewTheme = postData.postThemeId === -1;
    const course = await firstValueFrom(this.course$!);
    console.log('updatePostData', postData);
    if (isNewTheme && postData.newThemeText) {
      // 1. Создать новую тему в БД
      const postThemeDTO: PostThemeDTO = {
        postThemeText: postData.newThemeText,
        courseId: course!.courseId!,
      };
      this.api
        .post<PostThemeDTO>('PostTheme', postThemeDTO)
        .subscribe((newTheme: PostThemeDTO) => {
          postData.postThemeId = newTheme.postThemeId;
        });
    }
    this.saveTaskToApi(postData);
  }

  private async saveTaskToApi(task: any): Promise<void> {
    try {
      const teacher = await firstValueFrom(this.api.teacher$);
      const course = await firstValueFrom(this.course$!);
      const postDto: PostDTO = {
        postId: this.postDTO.postId,
        postTitle: task.postTitle,
        postDescription: task.postDescription,
        postType: PostTypeEnum.Task,
        postThemeId: task.themeId,
        courseId: course!.courseId!,
        userId: teacher?.userId!,
        created: this.postDTO.created,
      };

      this.api.put<PostDTO>('Post', postDto, postDto.postId!).subscribe({
        next: () => {
          this.api
            .getById<TaskDTO[]>('task/post', postDto.postId!)
            .pipe(
              switchMap((tasks: TaskDTO[]) => {
                console.log(tasks);
                console.log('newtaskdata', task);
                const taskRequests = tasks.map((currentTask) => {
                  const taskDTO: TaskDTO = {
                    taskId: currentTask.taskId,
                    postId: postDto.postId!,
                    dueTime: task.dueTime,
                    subjectId: course!.subjectId!,
                    teacherId: teacher?.userId!,
                    courseId: course!.courseId!,
                    taskStatus:
                      currentTask.taskStatus ==
                        TaskStatusEnum.ReturnedWithMark ||
                      currentTask.taskStatus == TaskStatusEnum.Submitted
                        ? currentTask.taskStatus
                        : TaskStatusEnum.Appointed,
                    studentId: currentTask.studentId!,
                    mark: currentTask.mark,
                    maxMark: task.maxMark,
                    lastUpdate: new Date().toISOString(),
                  };
                  return this.api.put<TaskDTO>(
                    'Task',
                    taskDTO,
                    taskDTO.taskId!
                  );
                });

                return forkJoin(taskRequests); // возвращаем observable
              })
            )
            .subscribe({
              next: () => {
                this.notificationService.show(
                  '✅ Задание успешно сохранено',
                  'success'
                );
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              },
              error: (err) => {
                console.error(err);
                this.notificationService.show(
                  '❌ Ошибка при редактировани задания',
                  'error'
                );
              },
            });
        },
      });
    } catch (err) {
      console.error(err);
      this.notificationService.show(
        '❌ Ошибка при редактировани задания',
        'error'
      );
    }
  }

  async onDeleteTask() {
    const confirmed = window.confirm('Вы точно хотите удалить пост?');

    if (!confirmed) return;
    this.api.delete('post', this.post$.id).subscribe({
      next: () => {
        this.notificationService.show('✅ Пост успешно удален', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },

      error: (err) => {
        console.error(err);
        this.notificationService.show('❌ Ошибка при удалении поста', 'error');
      },
    });
  }

  getComments(): Observable<CommentDTO[]> {
    return this.api.get<CommentDTO[]>(`Comment/post/${this.post$.id}`);
  }

  onAddComment(CommentText: string) {
    const commentDTO: CommentDTO = {
      postId: this.post$.id,
      commentText: CommentText,
      authorId: this.user?.userId!,
      date: new Date().toISOString(),
    };

    console.log(CommentText);

    this.api.post<CommentDTO>('Comment', commentDTO).subscribe({
      next: () => {
        this.notificationService.show(
          '✅ Комментарий успешно добавлен',
          'success'
        );
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        this.notificationService.show(
          '❌ Ошибка при удалении задания',
          'error'
        );
      },
    });
  }

  onDeleteComment(commentId: number) {
    return this.api.delete('Comment', commentId).subscribe({
      next: () => {
        this.notificationService.show(
          '✅ Комментарий успешно удален',
          'success'
        );
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        this.notificationService.show(
          '❌ Ошибка при удалении комментария',
          'error'
        );
      },
    });
  }

  private async getStudentsForCourse() {
    const course = await firstValueFrom(this.course$!);
    this.api
      .get<StudentDTO[]>(`Student/group/${course!.groupId}`)
      .subscribe((students) => {
        this.students = students;
      });
  }

  submitComment(event: Event) {
    event.preventDefault();
    this.onAddComment(this.newCommentText);
  }

  private CommentToViewModel(
    dtos: CommentDTO[]
  ): Observable<CommentViewModel[]> {
    return forkJoin(
      dtos.map((dto) => {
        const authorData$ =
          dto.authorId !== this.user?.userId
            ? this.api
                .getById<StudentDTO>('Student', dto.authorId)
                .pipe(
                  switchMap((student) =>
                    this.getPersonalData(student.personalDataId!)
                  )
                )
            : this.getPersonalData(this.user.personalDataId!);

        return authorData$.pipe(
          switchMap((authorDetails) =>
            from(this.getAvatarSafeUrl(authorDetails.personalDataId!)).pipe(
              map((avatar) => ({
                ...dto,
                authorName: `${authorDetails.lastname ?? ''} ${
                  authorDetails.name ?? ''
                } ${authorDetails.patronymic ?? ''}`.trim(),
                authorAvatar: avatar,
              }))
            )
          )
        );
      })
    );
  }

  async getAvatarSafeUrl(authorId: number): Promise<string | SafeResourceUrl> {
    try {
      const blob = await firstValueFrom(this.api.getAvatar(authorId));
      if (blob.type.startsWith('image/')) {
        const blobUrl = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      } else {
        return 'assets/images/user_icon_not_found_100px.png';
      }
    } catch (e) {
      console.error(e);
      return 'assets/images/user_icon_not_found_100px.png';
    }
  }

  onInputChange(event: Event) {
    const target = event.target as HTMLElement | null;
    this.newCommentText = target?.innerText || '';
  }

  toggleMenu(commentId: number) {
    this.selectedCommentId =
      this.selectedCommentId === commentId ? null : commentId;
  }

  @HostListener('document:click', ['$event'])
  closeMenu(event: Event): void {
    const clickedElement = event.target as HTMLElement;
    const isMenuClicked = clickedElement.closest('.comment-menu');
    const isButtonClicked = clickedElement.closest('.menu-button');

    if (!isMenuClicked && !isButtonClicked) {
      this.selectedCommentId = null;
    }
  }

  encodeId(id: number): string {
    return encodeId(id);
  }
}
