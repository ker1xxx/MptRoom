import { Component, Input, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { encodeId } from '../../../../../../helper/util';
import { CourseViewModel } from '../../../../../../models/VM/course.viewmode';
import { CommonModule } from '@angular/common';
import { PostTypeEnum } from '../../../../../../models/enums/post-type.enum';
import { PostModalComponent } from '../post-modal/post-modal.component';
import { ApiService } from '../../../../../../services/api.service';
import { PostThemeDTO } from '../../../../../../models/DTO/post-theme.dto';
import { PostDTO } from '../../../../../../models/DTO/post.dto';
import { TaskDTO } from '../../../../../../models/DTO/task.dto';
import { TaskStatusEnum } from '../../../../../../models/enums/task-status.enum';
import { StudentDTO } from '../../../../../../models/DTO/student.dto';
import { firstValueFrom, forkJoin } from 'rxjs';
import { SurveyOptionDTO } from '../../../../../../models/DTO/survey-option.dto';
import { NotificationService } from '../../../../../../services/notification.service';
@Component({
  selector: 'teacher-sidebar-menu',
  imports: [CommonModule, PostModalComponent],
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.scss',
})
export class SidebarMenuComponent {
  @Input() course$!: CourseViewModel | null;
  darknes_scale = [20, 40, 60, 80];
  darkerColors: string[] = [];
  PostTypeEnum = PostTypeEnum;
  isEdit: boolean = false;
  students!: StudentDTO[];

  postThemes!: PostThemeDTO[];

  @ViewChild(PostModalComponent) postModal!: PostModalComponent;

  dropdownVisible: boolean = false; // Флаг видимости выпадающего списка
  selectedPostType: PostTypeEnum = PostTypeEnum.Post; // Выбранный тип поста
  isModalOpen: boolean = false; // Флаг для открытия модального окна

  constructor(
    private router: Router,
    private api: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnChanges() {
    if (this.course$) {
      this.darkerColors = this.darknes_scale.map((scale) =>
        this.darkenColor(this.course$!.hexademicalColor, scale)
      );
      this.getStudentsForCourse();
      this.api
        .get<PostThemeDTO[]>(`PostTheme/course/${this.course$.courseId}`)
        .subscribe((themes) => {
          this.postThemes = themes;
        });
    }
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

  // Переход на страницу курса
  navigateToCourse(): void {
    const courseHash = encodeId(this.course$!.courseId!);
    this.router.navigate(['teacher', 'course', courseHash]);
  }

  // Переход на страницу с постами
  navigateToPosts(): void {
    const courseHash = encodeId(this.course$!.courseId!);
    this.router.navigate(['teacher', 'course', courseHash, 'posts']);
  }

  // Переход на страницу с заданиями
  navigateToTasks(): void {
    const courseHash = encodeId(this.course$!.courseId!);
    this.router.navigate(['teacher', 'course', courseHash, 'tasks']);
  }

  // Переход на страницу с дополнительными материалами
  navigateToMaterials(): void {
    const courseHash = encodeId(this.course$!.courseId!);
    this.router.navigate(['teacher', 'course', courseHash, 'materials']);
  }

  toggleDropdown(): void {
    this.dropdownVisible = !this.dropdownVisible; // Переключаем видимость выпадающего списка
  }

  openCreatePostModal(postType: PostTypeEnum): void {
    this.selectedPostType = postType; // Устанавливаем выбранный тип поста
    this.isModalOpen = true; // Открываем модальное окно
    this.dropdownVisible = false; // Закрываем выпадающий список
  }

  onCancel(): void {
    this.isModalOpen = false;
  }

  onSavePost(post: any): void {
    const isNewTheme = post.postThemeId === -1;

    if (isNewTheme && post.newThemeText) {
      // 1. Создать новую тему в БД
      const postThemeDTO: PostThemeDTO = {
        postThemeText: post.newThemeText,
        courseId: this.course$?.courseId!,
      };
      this.api
        .post<PostThemeDTO>('PostTheme', postThemeDTO)
        .subscribe((newTheme: PostThemeDTO) => {
          post.postThemeId = newTheme.postThemeId;
          switch (post.type) {
            case PostTypeEnum.Post:
              this.savePostToApi(post);
              break;
            case PostTypeEnum.Task:
              this.saveTaskToApi(post);
              break;
            case PostTypeEnum.Survey:
              this.saveSurveyToApi(post);
              break;
            case PostTypeEnum.AdditionalMaterials:
              this.saveAdditionalMaterialToApi(post);
              break;
          }
          // 2. Сохранить пост с новым themeId
        });
    } else {
      // Если тема выбрана из списка — просто сохранить пост
      switch (post.type) {
        case PostTypeEnum.Post:
          this.savePostToApi(post);
          break;
        case PostTypeEnum.Task:
          this.saveTaskToApi(post);
          break;
        case PostTypeEnum.Survey:
          this.saveSurveyToApi(post);
          break;
        case PostTypeEnum.AdditionalMaterials:
          this.saveAdditionalMaterialToApi(post);
          break;
      }
    }
  }

  private savePostToApi(post: any): void {
    this.api.teacher$.subscribe((teacher) => {
      const postDto: PostDTO = {
        postId: post.postId,
        postTitle: post.postTitle,
        postDescription: post.postDescription,
        postType: PostTypeEnum.Post,
        postThemeId: Number(post.postThemeId),
        courseId: this.course$?.courseId!,
        userId: teacher?.userId!,
        created: new Date().toISOString(),
      };
      this.api.post<PostDTO>('Post', postDto).subscribe({
        next: () => {
          this.notificationService.show('✅ Пост успешно сохранен', 'success');
          this.isModalOpen = false;
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        error: (err) => {
          console.error(err);
          this.notificationService.show(
            '❌ Ошибка при сохранении поста',
            'error'
          );
        },
      });
    });
  }

  private getStudentsForCourse() {
    this.api
      .get<StudentDTO[]>(`Student/group/${this.course$?.groupId}`)
      .subscribe((students) => {
        this.students = students;
      });
  }

  private async saveTaskToApi(task: any): Promise<void> {
    try {
      const teacher = await firstValueFrom(this.api.teacher$);

      const postDto: PostDTO = {
        postId: task.postId,
        postTitle: task.postTitle,
        postDescription: task.postDescription,
        postType: PostTypeEnum.Task,
        postThemeId: Number(task.postThemeId),
        courseId: this.course$?.courseId!,
        userId: teacher?.userId!,
        created: new Date().toISOString(),
      };

      this.api.post<PostDTO>('Post', postDto).subscribe({
        next: (newPost) => {
          const taskRequests = this.students.map((student) => {
            const taskDTO: TaskDTO = {
              postId: newPost.postId,
              dueTime: task.dueTime,
              subjectId: this.course$?.subjectId!,
              teacherId: teacher?.userId!,
              courseId: this.course$?.courseId!,
              taskStatus: TaskStatusEnum.Appointed,
              studentId: student.userId!,
              maxMark: task.maxMark,
              lastUpdate: new Date().toISOString(),
            };
            return this.api.post<TaskDTO>('Task', taskDTO);
          });

          forkJoin(taskRequests).subscribe({
            next: () => {
              this.notificationService.show(
                '✅ Задание успешно сохранено',
                'success'
              );
              setTimeout(() => {
                window.location.reload();
              }, 1000);
              this.isModalOpen = false;
            },
            error: (err) => {
              console.error(err);
              this.notificationService.show(
                '❌ Ошибка при сохранении задания',
                'error'
              );
            },
          });
        },
        error: (err) => {
          console.error(err);
          this.notificationService.show(
            '❌ Ошибка при сохранении поста',
            'error'
          );
        },
      });
    } catch (err) {
      console.error(err);
      this.notificationService.show(
        '❌ Ошибка при получении преподавателя',
        'error'
      );
    }
  }

  private async saveSurveyToApi(survey: any): Promise<void> {
    try {
      const teacher = await firstValueFrom(this.api.teacher$);

      const postDto: PostDTO = {
        postId: survey.postId,
        postTitle: survey.postTitle,
        postDescription: survey.postDescription,
        postType: PostTypeEnum.Survey,
        postThemeId: Number(survey.postThemeId),
        courseId: this.course$?.courseId!,
        userId: teacher?.userId!,
        created: new Date().toISOString(),
      };
      this.api.post<PostDTO>('Post', postDto).subscribe({
        next: (newPost) => {
          const surveyRequest = survey.surveyOptions.map((option: string) => {
            const surveyDTO: SurveyOptionDTO = {
              postId: newPost.postId,
              optionName: option,
            };
            return this.api.post<SurveyOptionDTO>('SurveyOption', surveyDTO);
          });

          forkJoin(surveyRequest).subscribe({
            next: () => {
              this.notificationService.show(
                '✅ Опрос успешно сохранен',
                'success'
              );
              this.isModalOpen = false;
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            },
            error: (err) => {
              console.error(err);
              this.notificationService.show(
                '❌ Ошибка при сохранении опроса',
                'error'
              );
            },
          });
        },
        error: (err) => {
          console.error(err);
          this.notificationService.show(
            '❌ Ошибка при сохранении опроса',
            'error'
          );
        },
      });
    } catch (err) {
      console.error(err);
      this.notificationService.show(
        '❌ Ошибка при получении данных преподавателя',
        'error'
      );
    }
  }

  private async saveAdditionalMaterialToApi(
    additionalMaterial: any
  ): Promise<void> {
    try {
      const teacher = await firstValueFrom(this.api.teacher$);

      const postDto: PostDTO = {
        postId: additionalMaterial.postId,
        postTitle: additionalMaterial.postTitle,
        postDescription: additionalMaterial.postDescription,
        postType: PostTypeEnum.AdditionalMaterials,
        postThemeId: Number(additionalMaterial.postThemeId),
        courseId: this.course$?.courseId!,
        userId: teacher?.userId!,
        created: new Date().toISOString(),
      };
      this.api.post<PostDTO>('Post', postDto).subscribe({
        next: (newPost: PostDTO) => {
          const additionalMaterialRequest = additionalMaterial.files.map(
            (file: File) => {
              const formData = new FormData();
              formData.append('file', file);
              formData.append('userId', `${teacher!.userId!}`);
              formData.append('groupId', `${this.course$?.groupId!}`);
              formData.append('courseId', `${this.course$?.courseId}`);
              formData.append('subjectId', `${this.course$!.subjectId}`);
              formData.append('postId', `${newPost.postId}`);

              return this.api.post('additionalmaterial', formData);
            }
          );

          forkJoin(additionalMaterialRequest).subscribe({
            next: () => {
              this.notificationService.show(
                '✅ Дополнительный матерал успешно сохранен',
                'success'
              );
              setTimeout(() => {
                window.location.reload();
              }, 1000);
              this.isModalOpen = false;
            },
            error: (err) => {
              console.error(err);
              this.notificationService.show(
                '❌ Ошибка при сохранении дополнительного материала',
                'error'
              );
            },
          });
        },
        error: (err) => {
          console.error(err);
          this.notificationService.show(
            '❌ Ошибка при сохранении дополнительного материала',
            'error'
          );
        },
      });
    } catch (err) {
      console.error(err);
      this.notificationService.show(
        '❌ Ошибка при получении данных преподавателя',
        'error'
      );
    }
  }
}
