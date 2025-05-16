import { Component, HostListener, Input } from '@angular/core';
import { TaskViewModel } from '../../../../../models/VM/task.viewmodel';
import { ActivatedRoute, Router } from '@angular/router';
import { TaskStatusEnum } from '../../../../../models/enums/task-status.enum';
import { ApiService } from '../../../../../services/api.service';
import { HeaderComponent } from '../../../shared/header/header.component';
import { RussianDatePipe } from '../../../../../helper/RussianDatePipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentDTO } from '../../../../../models/DTO/student.dto';
import { GroupDTO } from '../../../../../models/DTO/group.dto';
import {
  catchError,
  firstValueFrom,
  forkJoin,
  from,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
} from 'rxjs';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { PersonalDataDTO } from '../../../../../models/DTO/personal-data.dto';
import { decodeId, encodeId } from '../../../../../helper/util';
import { PostDTO } from '../../../../../models/DTO/post.dto';
import { PostTypeEnum } from '../../../../../models/enums/post-type.enum';
import { CourseViewModel } from '../../../../../models/VM/course.viewmode';
import { PostViewModel } from '../../../../../models/VM/post.viewmodel';
import { TaskCardComponent } from './task-card/task-card.component';
import { AdditionalMaterialCardComponent } from './additional-material-card/additional-material-card.component';
import { SurveyCardComponent } from './survey-card/survey-card.component';
import { PostThemeDTO } from '../../../../../models/DTO/post-theme.dto';
import { TeacherDTO } from '../../../../../models/DTO/teacher.dto';
import { UserBaseDTO } from '../../../../../models/DTO/user-base.dto';
import { CourseDTO } from '../../../../../models/DTO/course.dto';
import { SubjectDTO } from '../../../../../models/DTO/subject.dto';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { PostHeaderComponent } from './post-header/post-header.component';
import { CommentDTO } from '../../../../../models/DTO/comment.dto';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommentViewModel } from '../../../../../models/VM/comment.viewmodel';
import { NotificationService } from '../../../../../services/notification.service';

@Component({
  selector: 'app-post-detail',
  imports: [
    HeaderComponent,
    CommonModule,
    FormsModule,
    TaskCardComponent,
    SurveyCardComponent,
    AdditionalMaterialCardComponent,
    SidebarMenuComponent,
    PostHeaderComponent,
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
  course!: CourseDTO;
  course$?: Observable<CourseViewModel | null>;
  student!: StudentDTO | null;
  postType = PostTypeEnum; // чтобы использовать в шаблоне
  isLoading = true;

  Comments: CommentViewModel[] = [];
  selectedCommentId: number | null = null;
  newCommentText: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private sanitizer: DomSanitizer,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    try {
      const postHash = this.route.snapshot.paramMap.get('postHash');
      if (!postHash) throw new Error('Post hash not found');
      const postId = decodeId(postHash);

      const courseHash = this.route.snapshot.paramMap.get('courseHash');
      if (!courseHash) throw new Error('Course hash not found');
      const courseId = decodeId(courseHash);

      // 1. Подгружаем студента
      this.student = await firstValueFrom(this.api.student$);
      if (!this.student) {
        this.router.navigate(['/login']);
        return;
      }
      this.api.getById<CourseDTO>('Course', courseId).subscribe((course) => {
        if (course.groupId !== this.student?.groupId)
          this.router.navigate(['/404']);
      });
      this.getPostViewModel(postId).subscribe((post) => {
        this.post$ = post;
        this.course$ = this.getCourseDetails(this.post$.courseId);
        this.isLoading = false;
        this.getComments().subscribe((comments) => {
          this.CommentToViewModel(comments).subscribe(
            (commentvm) => (this.Comments = commentvm)
          );
        });
      });
    } catch (error) {
      console.error(error);
      this.notificationService.show('❌ Ошибка при загрузке поста ', 'error');
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
        }).pipe(
          switchMap(({ theme, user }) =>
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
                  author: author,
                  authorId: user.userId!, // исправил: берем из user
                  courseId: post.courseId,
                  courseName: '', // если нужно подтянуть название курса — добавим сюда
                  groupId: 0, // тоже можно подтянуть отдельно, если надо
                  subjectId: 0,
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

  getComments(): Observable<CommentDTO[]> {
    return this.api.get<CommentDTO[]>(`Comment/post/${this.post$.id}`);
  }

  onAddComment(CommentText: string) {
    const commentDTO: CommentDTO = {
      postId: this.post$.id,
      commentText: CommentText,
      authorId: this.student?.userId!,
      date: new Date().toISOString(),
    };

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
          dto.authorId !== this.student?.userId
            ? this.api.getById<StudentDTO>('Student', dto.authorId).pipe(
                switchMap((student) =>
                  this.getPersonalData(student.personalDataId!)
                ),
                catchError((err) => {
                  // Если студент не найден (404), пробуем загрузить как преподавателя
                  if (err.status === 404) {
                    return this.api
                      .getById<TeacherDTO>('Teacher', dto.authorId)
                      .pipe(
                        switchMap((teacher) =>
                          this.getPersonalData(teacher.personalDataId!)
                        )
                      );
                  }
                  // В остальных случаях возвращаем заглушку
                  console.error('Ошибка получения автора:', err);
                  return of({
                    name: 'Неизвестный',
                    lastname: '',
                    patronymic: '',
                    personalDataId: -1,
                  } as PersonalDataDTO);
                })
              )
            : this.getPersonalData(this.student.personalDataId!);

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
