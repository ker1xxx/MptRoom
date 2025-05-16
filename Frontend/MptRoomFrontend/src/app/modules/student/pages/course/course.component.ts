import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseViewModel } from '../../../../models/VM/course.viewmode';
import { CourseDTO } from '../../../../models/DTO/course.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TaskViewModel } from '../../../../models/VM/task.viewmodel';
import {
  Observable,
  forkJoin,
  of,
  map,
  switchMap,
  catchError,
  tap,
  takeUntil,
  Subject,
} from 'rxjs';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { CollegeYearEnum } from '../../../../models/enums/college-year.enum';
import { ApiService } from '../../../../services/api.service';
import { TaskStatusEnum } from '../../../../models/enums/task-status.enum';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { PostViewModel } from '../../../../models/VM/post.viewmodel';
import { PostDTO } from '../../../../models/DTO/post.dto';
import { PostThemeDTO } from '../../../../models/DTO/post-theme.dto';
import { UserBaseDTO } from '../../../../models/DTO/user-base.dto';
import { PostTypeEnum } from '../../../../models/enums/post-type.enum';
import { RussianDatePipe } from '../../../../helper/RussianDatePipe';
import { decodeId, encodeId } from '../../../../helper/util';
import { SidebarMenuComponent } from './post-detail/sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [
    HeaderComponent,
    CommonModule,
    RussianDatePipe,
    SidebarMenuComponent,
  ],
  templateUrl: './course.component.html',
  styleUrl: './course.component.scss',
})
export class CourseComponent {
  constructor(
    private api: ApiService,
    private router: ActivatedRoute,
    private route: Router
  ) {}
  PostTypeEnum = PostTypeEnum;
  courseId!: number;
  courseHash!: string;
  course$?: CourseViewModel;
  student$?: StudentDTO;

  darknes_scale = [20, 40, 60];
  darkerColors: string[] = [];

  filteredPosts$?: PostViewModel[];
  posts$?: PostViewModel[];
  private destroy$ = new Subject<void>();

  postIcons = {
    [PostTypeEnum.AdditionalMaterials]: 'assets/images/materials.png',
    [PostTypeEnum.Post]: 'assets/images/post.png',
    [PostTypeEnum.Task]: 'assets/images/task.png',
    [PostTypeEnum.Survey]: 'assets/images/survey.png',
  };

  ngOnInit(): void {
    this.router.paramMap
      .pipe(
        map((params) => {
          const courseHash = params.get('courseHash');
          if (!courseHash) throw new Error('Course hash not found');
          return decodeId(courseHash); // Обратите внимание на декодирование
        }),
        switchMap((courseId) => {
          this.courseId = courseId;

          return this.api.student$.pipe(
            switchMap((student) => {
              if (!student) {
                this.route.navigate(['/login']);
                return of(null);
              }
              this.student$ = student;

              return this.getCourseWithPosts(); // Получаем курс с постами
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          if (!result) return;
          if (
            result.course &&
            result.course.groupId === this.student$?.groupId
          ) {
            this.course$ = result.course;
            this.darkerColors = this.darknes_scale.map((scale) =>
              this.darkenColor(result.course!.hexademicalColor, scale)
            );
            this.posts$ = result.posts;
            this.filterPosts(); // Фильтруем посты после получения
          } else this.route.navigate(['/404']);
        },
        error: (err) => {
          console.error('Error loading course:', err);
          this.route.navigate(['/404']);
        },
      });
  }

  getCourseWithPosts(): Observable<{
    course: CourseViewModel | null;
    posts: PostViewModel[];
  }> {
    if (!this.courseId || this.courseId <= 0) {
      return of({ course: null, posts: [] });
    }

    return forkJoin({
      course: this.api
        .get<CourseDTO>(`Course/${this.courseId}`)
        .pipe(catchError(() => of(null))),
      posts: this.api
        .get<PostDTO[]>(`post/course/${this.courseId}`)
        .pipe(catchError(() => of([] as PostDTO[]))),
    }).pipe(
      switchMap(({ course, posts }) => {
        if (!course) return of({ course: null, posts: [] });

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
          posts: of(posts),
        }).pipe(
          switchMap(({ group, subject, teacherData, posts }) => {
            const courseViewModel: CourseViewModel = {
              courseId: course.courseId,
              courseName: subject.subjectName,
              groupId: course.groupId,
              groupName: group.groupName,
              subjectId: subject.subjectId!,
              subjectName: subject.subjectName,
              teacherId: course.teacherId,
              teacherName: teacherData?.personalData
                ? `${teacherData.personalData.lastname} ${
                    teacherData.personalData.name[0]
                  }.${teacherData.personalData.patronymic?.[0] ?? ''}`
                : 'Преподаватель не указан',
              hexademicalColor: subject.hexademicalColor,
            };

            return this.getPostViewModelsByCourse(this.courseId).pipe(
              map((postViewModels) => ({
                course: courseViewModel,
                posts: postViewModels,
              }))
            );
          })
        );
      })
    );
  }

  filterPosts(): void {
    const routePath = this.router.snapshot.url[2]?.path;

    // В зависимости от маршрута фильтруем посты
    switch (routePath) {
      case 'posts':
        this.filteredPosts$ = this.filterByPostType(PostTypeEnum.Post);
        break;
      case 'tasks':
        this.filteredPosts$ = this.filterByPostType(PostTypeEnum.Task);
        break;
      case 'materials':
        this.filteredPosts$ = this.filterByPostType(
          PostTypeEnum.AdditionalMaterials
        );
        break;
      default:
        this.filteredPosts$ = this.posts$; // По умолчанию показываем все посты
        break;
    }
  }

  // Метод для фильтрации по типу поста
  private filterByPostType(type: PostTypeEnum): PostViewModel[] {
    return this.posts$?.filter((post) => post.type === type) || [];
  }

  private getNearestTask(tasks: TaskDTO[]): TaskViewModel | undefined {
    const validTasks = tasks
      .filter(
        (task) =>
          task.taskStatus === TaskStatusEnum.Appointed &&
          new Date(task.dueTime) > new Date()
      )
      .sort(
        (a, b) => new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime()
      );

    const task = validTasks[0];
    if (!task) return undefined;

    return {
      postId: task.postId,
      sidebarColor: '#FFA500',
      dueTime: task.dueTime,
      subjectName: '',
      teacherName: '',
      taskName: `Задание #${task.postId}`,
      taskStatus: task.taskStatus,
      mark: task.mark,
      maxMark: task.maxMark,
      description: '',
      lastUpdate: task.lastUpdate,
    };
  }

  private darkenColor(hex: string, amount: number): string {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);

    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getPostViewModelsByCourse(courseId: number): Observable<PostViewModel[]> {
    return this.api.get<PostDTO[]>(`post/course/${courseId}`).pipe(
      switchMap((posts: PostDTO[]) => {
        const viewModelObservables = posts.map((post) => {
          return forkJoin({
            theme: this.getPostThemed(post.postThemeId),
            user: this.getTeacher(post.userId),
          }).pipe(
            switchMap(({ theme, user }) => {
              return this.getPersonalData(user.personalDataId!).pipe(
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
                    authorId: 0,
                    courseId: post.courseId,
                    courseName: '',
                    groupId: 0,
                    subjectId: 0,
                  };

                  return viewModel;
                })
              );
            })
          );
        });

        return forkJoin(viewModelObservables);
      })
    );
  }

  getPosts(courseId: number): Observable<PostDTO[]> {
    return this.api.get<PostDTO[]>(`posts/course/${courseId}`);
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

  // Добавляем деструктор
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPostSelected(post: PostViewModel): void {
    const courseHash = encodeId(this.course$!.courseId!);
    const postHash = encodeId(post.id);

    this.route.navigate(['student', 'course', courseHash, postHash]);
  }
}
