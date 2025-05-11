import { Component } from '@angular/core';
import { ApiService } from '../../../../../services/api.service';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { PostDTO } from '../../../../../models/DTO/post.dto';
import { PostViewModel } from '../../../../../models/VM/post.viewmodel';
import { PersonalDataDTO } from '../../../../../models/DTO/personal-data.dto';
import { PostTypeEnum } from '../../../../../models/enums/post-type.enum';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminHeaderComponent } from '../../../shared/header/header.component';
import { CourseDTO } from '../../../../../models/DTO/course.dto';
import { PostThemeDTO } from '../../../../../models/DTO/post-theme.dto';
import { SubjectDTO } from '../../../../../models/DTO/subject.dto';
import { GroupDTO } from '../../../../../models/DTO/group.dto';
import { CourseViewModel } from '../../../../../models/VM/course.viewmode';
import { TeacherDTO } from '../../../../../models/DTO/teacher.dto';
import { AuthorViewModel } from '../../../../../models/VM/author.viewmodel';
import { NotificationService } from '../../../../../services/notification.service';

@Component({
  selector: 'app-posts-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  templateUrl: './posts-page.component.html',
  styleUrls: ['./posts-page.component.scss'],
})
export class PostsPageComponent {
  posts: PostViewModel[] = [];
  filteredPosts: PostViewModel[] = [];
  courses: CourseDTO[] = [];
  themes: PostThemeDTO[] = [];
  authors: AuthorViewModel[] = [];
  groups: GroupDTO[] = []; // Предположим, у вас есть группы, которые нужно отфильтровать
  subjects: SubjectDTO[] = []; // Предположим, у вас есть предметы
  courseForDisplay: CourseViewModel[] = [];
  teachers: TeacherDTO[] = [];
  filter = {
    themeId: '',
    authorId: '',
    courseId: '',
    groupId: '', // Добавляем фильтрацию по группам
    subjectId: '', // Добавляем фильтрацию по предметам
  };
  PostTypes = [
    {
      value: PostTypeEnum.AdditionalMaterials,
      label: 'Дополнительные матриалы',
    },
    { value: PostTypeEnum.Post, label: 'Пост' },
    { value: PostTypeEnum.Task, label: 'Задание' },
    { value: PostTypeEnum.Survey, label: 'Опрос' },
  ];

  // Для модального окна
  isModalOpen = false;
  isEditMode = false;
  selectedPost: any = {};
  postTypeEnum = PostTypeEnum;
  postTypeLabels = {
    [PostTypeEnum.AdditionalMaterials]: 'Дополнительные материалы',
    [PostTypeEnum.Post]: 'Пост',
    [PostTypeEnum.Survey]: 'Опрос',
    [PostTypeEnum.Task]: 'Задание',
  };

  readonly NEW_THEME_ID = 0;

  selectedThemeId: number | null = null;
  newThemeText: string = '';
  showNewThemeInput: boolean = false;

  postCreate: PostDTO = {
    postId: 0,
    postTitle: '',
    postDescription: '',
    postType: PostTypeEnum.AdditionalMaterials,
    postThemeId: 0,
    courseId: 0,
    userId: 0,
    created: '',
  };

  selectedThemeOption: string | any;
  newThemeName: string = '';

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadCourses();
  }

  loadData(): void {
    forkJoin({
      posts: this.apiService.get<PostDTO[]>('Post'),
      courses: this.apiService.get<CourseDTO[]>('Course'),
      themes: this.apiService.get<PostThemeDTO[]>('PostTheme'),
      teachers: this.apiService.get<TeacherDTO[]>('Teacher'),
      personalData: this.apiService.get<PersonalDataDTO[]>('PersonalData'),
      groups: this.apiService.get<GroupDTO[]>('Group'),
      subjects: this.apiService.get<SubjectDTO[]>('Subject'),
    }).subscribe({
      next: ({
        posts,
        courses,
        themes,
        teachers,
        personalData,
        groups,
        subjects,
      }) => {
        this.courses = courses;
        this.themes = themes;
        this.groups = groups;
        this.subjects = subjects;

        this.teachers = teachers;

        // то же, что и было:
        const teachersWithData = teachers.filter(
          (t): t is TeacherDTO & { personalDataId: number } =>
            !!t.personalDataId
        );

        this.authors = teachersWithData
          .filter((t) => t.personalDataId)
          .map((teacher) => {
            const pd = personalData.find(
              (p) => p.personalDataId === teacher.personalDataId
            )!;
            return {
              userId: teacher.userId,
              fullName: `${pd.lastname} ${pd.name} ${
                pd.patronymic || ''
              }`.trim(),
            } as AuthorViewModel;
          })
          .filter((a) => !!a);

        this.processPosts(posts);
      },
      error: (err) => console.error('Ошибка загрузки данных:', err),
    });
  }

  processPosts(dtos: PostDTO[]): void {
    this.posts = [];
    dtos.forEach((dto) => {
      // Основной поток запросов
      this.apiService
        .get<TeacherDTO>(`Teacher/${dto.userId}`)
        .pipe(
          switchMap((teacher) =>
            forkJoin({
              personalData: this.apiService.getById<PersonalDataDTO>(
                'PersonalData',
                teacher.personalDataId!
              ),
              theme: this.apiService.getById<PostThemeDTO>(
                'PostTheme',
                dto.postThemeId
              ),
              course: this.apiService.getById<CourseDTO>(
                'Course',
                dto.courseId
              ),
            })
          ),
          switchMap(({ personalData, theme, course }) =>
            forkJoin({
              subject: this.apiService.getById<SubjectDTO>(
                'Subject',
                course.subjectId
              ),
              group: this.apiService.getById<GroupDTO>(
                'Group',
                course.groupId!
              ),
              personalData: of(personalData),
              theme: of(theme),
              course: of(course),
            })
          )
        )
        .subscribe({
          next: ({ subject, group, personalData, theme, course }) => {
            const author: AuthorViewModel = {
              userId: dto.userId,
              fullName: `${personalData.lastname} ${personalData.name} ${
                personalData.patronymic || ''
              }`.trim(),
            };

            const vm = this.mapPostDTOToViewModel(
              dto,
              author,
              theme.postThemeText,
              `${group.groupName} - ${subject.subjectName}`,
              group.groupId!,
              subject.subjectId!
            );

            this.posts.push(vm);
            this.applyFilters();
          },
          error: (err) => {
            console.error(`Ошибка обработки поста ${dto.postId}:`, err);
            // Можно добавить обработку ошибок, например, пропуск битого поста
          },
        });
    });
  }

  loadCourses() {
    this.apiService.get<CourseDTO[]>('Course').subscribe({
      next: (data) => {
        this.courses = data; // сохраняем "сырые" курсы, если надо
        this.courseForDisplay = []; // очищаем ViewModel список

        data.forEach((courseDTO) => {
          const group$ = this.apiService.get<GroupDTO>(
            `Group/${courseDTO.groupId}`
          );
          const subject$ = this.apiService.getById<SubjectDTO>(
            'Subject',
            courseDTO.subjectId
          );
          const teacher$ = this.apiService.get<TeacherDTO>(
            `Teacher/${courseDTO.teacherId}`
          );

          forkJoin([group$, subject$, teacher$]).subscribe({
            next: ([group, subject, teacher]) => {
              this.apiService
                .getById<PersonalDataDTO>(
                  'PersonalData',
                  teacher.personalDataId!
                )
                .subscribe({
                  next: (personalData) => {
                    const courseViewModel: CourseViewModel = {
                      courseId: courseDTO.courseId,
                      groupId: group.groupId,
                      groupName: group.groupName,
                      subjectId: subject.subjectId!,
                      subjectName: subject.subjectName,
                      hexademicalColor: subject.hexademicalColor,
                      teacherName: `${personalData.lastname} ${personalData.name}`,
                      courseName: `${group.groupName} - ${subject.subjectName}`,
                      teacherId: courseDTO.teacherId,
                    };

                    this.courseForDisplay.push(courseViewModel);
                    this.applyFilters(); // фильтруем после добавления
                  },
                  error: (err) =>
                    console.error('Ошибка загрузки PersonalData:', err),
                });
            },
            error: (err) =>
              console.error('Ошибка загрузки Group/Subject/Teacher:', err),
          });
        });
      },
      error: (err) => console.error('Ошибка загрузки курсов:', err),
    });
  }

  applyFilters(): void {
    this.filteredPosts = this.posts.filter((post) => {
      return (
        (this.filter.themeId ? post.theme === this.filter.themeId : true) &&
        (this.filter.authorId ? post.author === this.filter.authorId : true) &&
        (this.filter.courseId
          ? post.courseId === Number(this.filter.courseId)
          : true) &&
        (this.filter.groupId
          ? post.groupId === Number(this.filter.groupId)
          : true) &&
        (this.filter.subjectId
          ? post.subjectId === Number(this.filter.subjectId)
          : true)
      );
    });
  }

  private mapPostDTOToViewModel(
    dto: PostDTO,
    author: AuthorViewModel,
    themeTitle: string,
    courseName: string,
    groupId: number,
    subjectId: number
  ): PostViewModel {
    return {
      id: dto.postId ?? 0,
      title: dto.postTitle,
      theme: themeTitle,
      description: dto.postDescription,
      type: dto.postType,
      typeName: this.getType(dto.postType),
      date: new Date(dto.created).toLocaleDateString(),
      author: author.fullName,
      authorId: author.userId!,
      courseId: dto.courseId,
      courseName: courseName,
      groupId: groupId,
      subjectId: subjectId,
    };
  }

  getType(item: PostTypeEnum): string {
    switch (item) {
      case PostTypeEnum.AdditionalMaterials:
        return 'Дополнительные матриалы';
      case PostTypeEnum.Post:
        return 'Пост';
      case PostTypeEnum.Survey:
        return 'Опрос';
      case PostTypeEnum.Task:
        return 'Задание';
      default:
        return '';
    }
  }

  private preparePostDto(): PostDTO {
    return {
      postId: this.selectedPost.postId,
      postTitle: this.selectedPost.postTitle,
      postDescription: this.selectedPost.postDescription,
      postType: this.selectedPost.postType,
      postThemeId: this.selectedPost.postThemeId,
      courseId: this.selectedPost.courseId,
      userId: this.selectedPost.userId,
      created: this.isEditMode
        ? this.selectedPost.created
        : new Date().toISOString(),
    };
  }

  // Удалить пост
  deletePost(postId: number): void {
    if (confirm('Удалить пост?')) {
      this.apiService.delete('Post', postId).subscribe(() => {
        this.loadData();
      });
    }
  }

  // Открыть модальное окно для добавления или редактирования
  openModal(post?: PostViewModel) {
    this.isEditMode = !!post;
    this.isModalOpen = true;

    if (post) {
      // Преобразование ViewModel в DTO для редактирования
      this.selectedPost = {
        postId: post.id,
        postTitle: post.title,
        postDescription: post.description,
        postType: post.type,
        postThemeId:
          this.themes.find((t) => t.postThemeText === post.theme)
            ?.postThemeId || 0,
        courseId: post.courseId,
        userId: this.authors.find((a) => a.userId === post!.authorId),
        created: new Date().toISOString(), // временное значение, будет заменено при сохранении
      };

      // Сброс полей новой темы
      this.showNewThemeInput = false;
      this.newThemeText = '';
    } else {
      this.selectedPost = {
        postId: 0,
        postTitle: '',
        postDescription: '',
        postType: PostTypeEnum.AdditionalMaterials,
        postThemeId: 0,
        courseId: 0,
        userId: 0,
        created: '',
      };
    }
  }

  // Закрыть модальное окно
  closeModal(): void {
    this.isModalOpen = false;
    this.applyFilters();
  }

  onSelectChange(selectedAuthor: AuthorViewModel): void {}

  savePost(): void {
    // Собираем данные из формы
    const postDto: PostDTO = {
      postId: this.selectedPost.postId,
      postTitle: this.selectedPost.postTitle,
      postDescription: this.selectedPost.postDescription,
      postType: Number(this.selectedPost.postType),
      postThemeId: Number(this.selectedPost.postThemeId),
      courseId: Number(this.selectedPost.courseId),
      userId: this.selectedPost.userId,
      created: this.isEditMode
        ? this.selectedPost.created
        : new Date().toISOString(),
    };

    // Логика создания новой темы
    if (this.showNewThemeInput && this.newThemeText.trim()) {
      this.createNewTheme(this.newThemeText).subscribe({
        next: (newTheme) => {
          postDto.postThemeId = newTheme.postThemeId!;
          this.savePostRequest(postDto);
          this.notificationService.show('✅ Пост успешно сохранен', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        error: (err) => {
          console.error('Ошибка создания темы:', err);
          this.notificationService.show(
            '❌ Ошибка при сохранении поста',
            'error'
          );
        },
      });
    } else {
      this.savePostRequest(postDto);
    }
  }

  private savePostRequest(postDto: PostDTO): void {
    const request$ = this.isEditMode
      ? this.apiService.put<PostDTO>('Post', postDto, postDto.postId!)
      : this.apiService.post<PostDTO>('Post', postDto);

    request$.subscribe({
      next: () => {
        this.closeModal();
        this.loadData(); // Перезагружаем данные
        this.notificationService.show('✅ Пост успешно сохранен', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      error: (err) => {
        console.error('Ошибка сохранения:', err);
        console.error('Ошибка создания темы:', err);
        this.notificationService.show(
          '❌ Ошибка при сохранениии поста',
          'error'
        );
      },
    });
  }

  finalizePostCreation(): void {
    this.apiService.post<PostDTO>('Post', this.postCreate).subscribe({
      next: (savedPost) => {
        this.closeModal();
        this.loadData(); // перезагружаем
        this.notificationService.show('✅ Пост успешно сохранен', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      error: (err) => {
        console.error('Ошибка при сохранении поста:', err);
        console.error('Ошибка создания темы:', err);
        this.notificationService.show(
          '❌ Ошибка при сохранении поста',
          'error'
        );
      },
    });
  }

  onThemeChange(event: Event) {
    const value = +(event.target as HTMLSelectElement).value;

    this.selectedThemeId = value;
    this.showNewThemeInput = value === this.NEW_THEME_ID;

    if (!this.showNewThemeInput) {
      this.newThemeText = '';
    }
  }
  //TODO
  createNewTheme(name: string): Observable<PostThemeDTO> {
    const dto: PostThemeDTO = {
      postThemeText: name,
      courseId: 1,
    };

    return this.apiService.post<PostThemeDTO>('PostTheme', dto).pipe(
      map((theme) => {
        this.themes.push(theme);
        return theme;
      })
    );
  }

  createPost(dto: PostDTO): Observable<PostDTO> {
    return this.apiService.post('/post', dto);
  }
}
