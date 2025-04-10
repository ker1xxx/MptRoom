import { Component } from '@angular/core';
import { ApiService } from '../../../../../services/api.service';
import { forkJoin, Observable } from 'rxjs';
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

@Component({
  selector: 'app-posts-page',
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

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      posts: this.apiService.get<PostDTO[]>('Post'),
      courses: this.apiService.get<CourseDTO[]>('Course'),
      themes: this.apiService.get<any[]>('PostTheme'),
      authors: this.apiService.get<PersonalDataDTO[]>('PersonalData'),
      groups: this.apiService.get<any[]>('Groups'), // Получаем группы
      subjects: this.apiService.get<any[]>('Subjects'), // Получаем предметы
    }).subscribe({
      next: ({ posts, courses, themes, authors }) => {
        this.courses = courses;
        this.themes = themes;
        this.authors = authors;
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
                  this.applyFilters(); // Обновляем фильтрацию после добавления
                });
            });
        },
        error: (err) =>
          console.error(`Ошибка загрузки автора поста ${dto.postId}`, err),
      });
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
  savePost(): void {
    const postToSave = {
      ...this.selectedPost,
      postType: PostTypeEnum[this.selectedPost.postType], // Преобразуем тип поста
    };

    if (this.isEditMode) {
      // Редактирование существующего поста
      this.apiService
        .put<PostDTO>('Post', postToSave, postToSave.postId)
        .subscribe(() => {
          this.closeModal();
          this.loadData();
        });
    } else {
      // Добавление нового поста
      this.apiService.post('Post', postToSave).subscribe(() => {
        this.closeModal();
        this.loadData();
      });
    }
  }
}
