import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Subject,
  map,
  switchMap,
  of,
  takeUntil,
  Observable,
  forkJoin,
  catchError,
} from 'rxjs';
import { decodeId, encodeId } from '../../../../helper/util';
import { CourseDTO } from '../../../../models/DTO/course.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { PostThemeDTO } from '../../../../models/DTO/post-theme.dto';
import { PostDTO } from '../../../../models/DTO/post.dto';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { UserBaseDTO } from '../../../../models/DTO/user-base.dto';
import { PostTypeEnum } from '../../../../models/enums/post-type.enum';
import { TaskStatusEnum } from '../../../../models/enums/task-status.enum';
import { CourseViewModel } from '../../../../models/VM/course.viewmode';
import { PostViewModel } from '../../../../models/VM/post.viewmodel';
import { TaskViewModel } from '../../../../models/VM/task.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { RussianDatePipe } from '../../../../helper/RussianDatePipe';
import { SidebarMenuComponent } from './post-detail/sidebar-menu/sidebar-menu.component';
import { PostModalComponent } from './post-detail/post-modal/post-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'teacher-course',
  imports: [
    HeaderComponent,
    CommonModule,
    RussianDatePipe,
    SidebarMenuComponent,
    FormsModule,
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
  user$?: TeacherDTO;

  darknes_scale = [20, 40, 60];
  darkerColors: string[] = [];

  filteredPosts$?: PostViewModel[];
  posts$!: PostViewModel[] | [];
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
          return this.api.teacher$.pipe(
            switchMap((teacher) => {
              if (!teacher) {
                this.route.navigate(['/login']);
                return of(null);
              }
              this.user$ = teacher;
              return this.getCourseWithPosts(); // Получаем курс с постами
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          if (!result) return;
          if (result.course && result.course.teacherId === this.user$?.userId) {
            this.course$ = result.course;
            this.darkerColors = this.darknes_scale.map((scale) =>
              this.darkenColor(result.course!.hexademicalColor, scale)
            );
            this.posts$ = result.posts || [];
            this.filterPosts(); // Фильтруем посты после получения
          } else this.route.navigate(['/404']);
        },
        error: (err) => {
          console.error('Error loading course:', err);
          this.route.navigate(['/404']);
        },
      });
    console.log(this.course$);
    console.log('posts', this.posts$);
  }

  getCourseWithPosts(): Observable<{
    course: CourseViewModel | null;
    posts: PostViewModel[];
  }> {
    if (!this.courseId || this.courseId <= 0) {
      return of({ course: null, posts: [] });
    }
    // Основные API-запросы
    const course$ = this.api
      .get<CourseDTO>(`Course/${this.courseId}`)
      .pipe(catchError(() => of(null)));

    const posts$ = this.api
      .get<PostDTO[]>(`post/course/${this.courseId}`)
      .pipe(catchError(() => of([])));

    // Загружаем всё вместе
    return forkJoin({ course: course$, posts: posts$ }).pipe(
      switchMap(({ course }) => {
        if (!course) return of({ course: null, posts: [] });

        return forkJoin({
          group: this.getGroup(course.groupId!),
          subject: this.getSubject(course.subjectId),
          teacherName: this.getTeacherName(course.teacherId),
        }).pipe(
          switchMap(({ group, subject, teacherName }) => {
            const courseVM: CourseViewModel = {
              courseId: course.courseId,
              courseName: subject.subjectName,
              groupId: course.groupId,
              groupName: group.groupName,
              subjectId: subject.subjectId!,
              subjectName: subject.subjectName,
              teacherId: course.teacherId,
              teacherName,
              hexademicalColor: subject.hexademicalColor,
            };
            console.log(courseVM);
            return this.getPostViewModelsByCourse(this.courseId).pipe(
              map((postViewModels) => ({
                course: courseVM,
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
        console.log('фильтрация постов');
        break;
      case 'tasks':
        this.filteredPosts$ = this.filterByPostType(PostTypeEnum.Task);
        console.log('фильтрация заданий');
        break;
      case 'materials':
        this.filteredPosts$ = this.filterByPostType(
          PostTypeEnum.AdditionalMaterials
        );
        console.log('фильтрация материалов');
        break;
      default:
        this.filteredPosts$ = this.posts$; // По умолчанию показываем все посты
        console.log('фильтрация отсутствует');
        break;
    }
    console.log(this.filteredPosts$);
  }

  // Метод для фильтрации по типу поста
  private filterByPostType(type: PostTypeEnum): PostViewModel[] {
    return this.posts$?.filter((post) => post.type === type) || [];
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
        if (posts.length === 0) return of([]);
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
                  console.log('viewmodel', viewModel);

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
  private getGroup(groupId: number): Observable<GroupDTO> {
    return this.api
      .get<GroupDTO>(`group/${groupId}`)
      .pipe(
        catchError(() =>
          of({ groupId: 0, groupName: 'Группа не найдена' } as GroupDTO)
        )
      );
  }

  private getSubject(subjectId: number): Observable<SubjectDTO> {
    return this.api.get<SubjectDTO>(`subject/${subjectId}`).pipe(
      catchError(() =>
        of({
          subjectId: 0,
          subjectName: 'Предмет не найден',
          hexademicalColor: '#cccccc',
        } as SubjectDTO)
      )
    );
  }

  private getTeacherName(teacherId: number): Observable<string> {
    return this.api.get<TeacherDTO>(`teacher/${teacherId}`).pipe(
      switchMap((teacher) => {
        if (!teacher || !teacher.personalDataId)
          return of('Преподаватель не указан');
        return this.api
          .get<PersonalDataDTO>(`personaldata/${teacher.personalDataId}`)
          .pipe(
            map(
              (pd) => `${pd.lastname} ${pd.name[0]}.${pd.patronymic?.[0] ?? ''}`
            ),
            catchError(() => of('Преподаватель не указан'))
          );
      }),
      catchError(() => of('Преподаватель не указан'))
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

  // Добавляем деструктор
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPostSelected(post: PostViewModel): void {
    const courseHash = encodeId(this.course$!.courseId!);
    const postHash = encodeId(post.id);

    this.route.navigate(['teacher', 'course', courseHash, postHash]);
  }
}
