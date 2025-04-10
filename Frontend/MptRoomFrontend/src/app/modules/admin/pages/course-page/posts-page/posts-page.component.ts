import { Component } from '@angular/core';
import { ApiService } from '../../../../../services/api.service';
import { forkJoin, map, Observable } from 'rxjs';
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
  authors: PersonalDataDTO[] = [];
  groups: GroupDTO[] = []; // Предположим, у вас есть группы, которые нужно отфильтровать
  subjects: SubjectDTO[] = []; // Предположим, у вас есть предметы
  courseForDisplay: CourseViewModel[] = [];
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
  courseThemes: PostThemeDTO[] = [];

  showNewThemeInput: boolean = false;

  constructor(private apiService: ApiService) {}

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
        console.log(themes);
        // то же, что и было:
        const teachersWithData = teachers.filter(
          (t): t is TeacherDTO & { personalDataId: number } =>
            !!t.personalDataId
        );

        this.authors = teachersWithData
          .map((teacher) =>
            personalData.find(
              (p) => p.personalDataId === teacher.personalDataId
            )
          )
          .filter((a): a is PersonalDataDTO => !!a);

        this.processPosts(posts);
      },
      error: (err) => console.error('Ошибка загрузки данных:', err),
    });
  }

  processPosts(dtos: PostDTO[]): void {
    this.posts = [];
    dtos.forEach((dto) => {
      forkJoin([
        this.apiService.getById<PersonalDataDTO>('PersonalData', dto.userId),
        this.apiService.getById<PostThemeDTO>('PostTheme', dto.postThemeId),
        this.apiService.getById<CourseDTO>('Course', dto.courseId),
      ]).subscribe({
        next: ([author, theme, course]) => {
          console.log(dto);
          const subject = this.apiService
            .getById<SubjectDTO>('Subject', course.subjectId)
            .subscribe((subj) => {
              const group = this.apiService
                .getById<GroupDTO>('Group', course.groupId!)
                .subscribe((gr) => {
                  const vm = this.mapPostDTOToViewModel(
                    dto,
                    `${author.lastname} ${author.name}`,
                    theme.postThemeText,
                    `${gr.groupName} - ${subj.subjectName}`,
                    gr.groupId!,
                    subj.subjectId!
                  );
                  this.posts.push(vm);
                  console.log(course);
                  console.log(vm);
                  this.applyFilters(); // Обновляем фильтрацию после добавления
                });
            });
        },
        error: (err) =>
          console.error(`Ошибка загрузки автора поста ${dto.postId}`, err),
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

  // Преобразование из DTO в ViewModel
  mapCourseDTOtoViewModel(courseDTO: any): CourseViewModel {
    // Преобразование DTO в ViewModel
    return {
      courseId: courseDTO.courseId,
      courseName: courseDTO.courseName,
      groupId: courseDTO.groupId,
      groupName: courseDTO.groupName,
      subjectId: courseDTO.subjectId,
      subjectName: courseDTO.subjectName,
      teacherId: courseDTO.teacherId,
      teacherName: courseDTO.teacherName,
      hexademicalColor: courseDTO.hexademicalColor,
    };
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

  mapPostDTOToViewModel(
    dto: PostDTO,
    authorName: string,
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
      type: this.getType(dto.postType),
      date: new Date(dto.created).toLocaleDateString(),
      author: authorName,
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

  // Удалить пост
  deletePost(postId: number): void {
    if (confirm('Удалить пост?')) {
      this.apiService.delete('Post', postId).subscribe(() => {
        this.loadData();
      });
    }
  }

  // Открыть модальное окно для добавления или редактирования
  openModal(post?: PostViewModel): void {
    this.isModalOpen = true;
    this.isEditMode = !!post;
    this.selectedPost = post
      ? { ...post }
      : {
          postTitle: '',
          postDescription: '',
          postType: PostTypeEnum.AdditionalMaterials,
          postThemeId: '',
          courseId: '',
          courseName: '',
          userId: '',
        };
  }

  // Закрыть модальное окно
  closeModal(): void {
    this.isModalOpen = false;
  }

  // Сохранить пост
  savePost() {
    // Проверяем, выбрана ли новая тема
    if (this.selectedThemeOption === -1 && this.newThemeName) {
      // Логика для создания новой темы
      this.createNewTheme(this.newThemeName);
    } else {
      // Логика для сохранения поста с выбранной существующей темой
      this.postCreate.postThemeId = this.selectedThemeOption!; // Устанавливаем ID выбранной темы

      // Здесь можно продолжить сохранение поста
      // Например, отправить пост на сервер
      this.apiService.post<PostDTO>('Post', this.postCreate).subscribe({
        next: (savedPost) => {
          console.log('Пост успешно сохранен:', savedPost);
          // Закрыть модальное окно или выполнить другие действия после успешного сохранения
          this.closeModal();
        },
        error: (err) => {
          console.error('Ошибка при сохранении поста:', err);
        },
      });
    }
  }

  onThemeChange() {
    console.log('Выбрана тема:', this.selectedThemeOption);
  }

  onCourseChange(): void {
    if (!this.postCreate.courseId) {
      this.courseThemes = [];
      return;
    }

    const courseThemesSet = new Map<number, PostThemeDTO>();

    for (const post of this.posts) {
      if (post.courseId === this.postCreate.courseId && post.theme) {
        const theme = this.themes.find((t) => t.postThemeText === post.theme);
        if (theme && !courseThemesSet.has(theme.postThemeId!)) {
          courseThemesSet.set(theme.postThemeId!, theme);
        }
      }
    }

    this.courseThemes = Array.from(courseThemesSet.values());
  }

  createNewTheme(newTheme: string) {
    const dto: PostThemeDTO = {
      postThemeText: newTheme,
    };

    this.apiService.post<PostThemeDTO>('PostTheme', dto).subscribe({
      next: (createdTheme) => {
        // Добавляем созданную тему в список
        this.themes.push(createdTheme);
        // Устанавливаем только что созданную тему как выбранную
        this.selectedThemeOption = createdTheme.postThemeId;
      },
      error: (err) => console.error('Ошибка при создании новой темы:', err),
    });
  }

  createPost(dto: PostDTO): Observable<PostDTO> {
    return this.apiService.post('/post', dto);
  }
}
