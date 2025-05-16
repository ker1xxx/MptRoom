import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StudentDTO } from '../../../../../../models/DTO/student.dto';
import { AdditionalMaterialDTO } from '../../../../../../models/DTO/additional-material.dto';
import { ApiService } from '../../../../../../services/api.service';
import { PostViewModel } from '../../../../../../models/VM/post.viewmodel';
import { PostDTO } from '../../../../../../models/DTO/post.dto';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { Observable, switchMap, map, take } from 'rxjs';
import { PersonalDataDTO } from '../../../../../../models/DTO/personal-data.dto';
import { PostThemeDTO } from '../../../../../../models/DTO/post-theme.dto';
import { TeacherDTO } from '../../../../../../models/DTO/teacher.dto';
import { UserBaseDTO } from '../../../../../../models/DTO/user-base.dto';
import { PostTypeEnum } from '../../../../../../models/enums/post-type.enum';
import { TaskViewModel } from '../../../../../../models/VM/task.viewmodel';
import { TaskDTO } from '../../../../../../models/DTO/task.dto';
import { CourseViewModel } from '../../../../../../models/VM/course.viewmode';
import { RussianDatePipe } from '../../../../../../helper/RussianDatePipe';
import { TaskStatusEnum } from '../../../../../../models/enums/task-status.enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SafeUrlPipe } from '../../../../../../helper/safeurl.pipe';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PreviewModalComponent } from '../preview-modal/preview-modal.component';
import { TaskAnswerDTO } from '../../../../../../models/DTO/task-answer.dto';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule, FormsModule, RussianDatePipe, PreviewModalComponent],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent {
  @Input() postId!: number;
  @Input() student!: StudentDTO;
  @Input() course$!: Observable<CourseViewModel | null>;
  link = '';
  file?: File;
  submitted = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  selectedFiles: File[] = [];
  previewUrls: (string | undefined)[] = [];
  isDragging = false;
  user$!: StudentDTO;
  post$!: PostViewModel;
  task$!: TaskViewModel;
  TaskStatusEnum = TaskStatusEnum;
  additionalMaterials$?: AdditionalMaterialDTO[];
  selectedFileId?: number;
  selectedFilePath?: string;

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  async ngOnInit() {
    await this.api.student$.subscribe((student) => {
      if (student) {
        this.user$ = student;
        this.postToViewModel(this.postId).subscribe((post) => {
          this.post$ = post;
          this.taskToViewModel(this.post$).subscribe((task) => {
            this.task$ = task;
            this.getAdditionalMaterials(task.taskId!);
          });
        });
      }
    });
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

  getTaskStatus(type: TaskStatusEnum): string {
    switch (type) {
      case TaskStatusEnum.Appointed:
        return 'Назначено';
      case TaskStatusEnum.DeadlineMissed:
        return 'Пропущен срок сдачи';
      case TaskStatusEnum.ReturnedWithMark:
        return 'Возвращено с оценкой';
      case TaskStatusEnum.Submitted:
        return 'Сдано';
      default:
        return 'Неизвестно';
    }
  }

  getAdditionalMaterials(taskId: number) {
    this.api
      .get<AdditionalMaterialDTO[]>(`AdditionalMaterial/task/${taskId}`)
      .subscribe((mats) => {
        this.additionalMaterials$ = mats.filter(
          (am) => am.userId == this.student.userId
        );
      });
  }

  postToViewModel(postId: number): Observable<PostViewModel> {
    return this.api.getById<PostDTO>('post', postId).pipe(
      switchMap((post: PostDTO) =>
        forkJoin({
          theme: this.getPostThemed(post.postThemeId),
          user: this.getTeacher(post.userId),
        }).pipe(
          switchMap(({ theme, user }) =>
            this.getPersonalData(user.personalDataId!).pipe(
              switchMap((personal) =>
                this.course$.pipe(
                  take(1),
                  map((course) => {
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
                      authorId: user.userId!,
                      courseId: post.courseId,
                      courseName: '', // можно дополнить, если курс есть
                      groupId: 0, // можно дополнить
                      subjectId: course?.subjectId!,
                    };

                    return viewModel;
                  })
                )
              )
            )
          )
        )
      )
    );
  }

  taskToViewModel(post: PostViewModel): Observable<TaskViewModel> {
    return this.course$.pipe(
      take(1), // берем только первое значение курса
      switchMap((course) =>
        this.api.getById<TaskDTO[]>('task/post', post.id!).pipe(
          map((task: TaskDTO[]) => {
            const taskForStudent = task.find(
              (t) => t.studentId == this.student.userId
            );
            const viewModel: TaskViewModel = {
              taskId: taskForStudent!.taskId,
              postId: post.id,
              sidebarColor: course!.hexademicalColor, // цвет берем из курса
              dueTime: taskForStudent!.dueTime,
              subjectName: post.theme, // или отдельное поле, если добавишь
              teacherName: post.author,
              taskName: post.title,
              taskStatus: taskForStudent!.taskStatus,
              mark: taskForStudent!.mark,
              maxMark: taskForStudent!.maxMark,
              description: post.description,
              lastUpdate: taskForStudent!.lastUpdate,
            };

            return viewModel;
          })
        )
      )
    );
  }

  onClickFileInput() {
    this.fileInput.nativeElement.click();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files.length) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFiles(Array.from(input.files));
    }
  }

  handleFiles(files: File[]) {
    for (const file of files) {
      this.selectedFiles.push(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.previewUrls.push(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        this.previewUrls.push(undefined);
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  submit() {
    if (this.selectedFiles.length === 0) return;
    for (var selectedFile of this.selectedFiles) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', `${this.user$.userId!}`);
      formData.append('courseId', `${this.post$.courseId}`);
      formData.append('groupId', `${this.student.groupId}`);
      formData.append('subjectId', `${this.post$.subjectId}`);
      formData.append('postId', `${this.task$.postId}`);

      this.api.post('additionalmaterial', formData).subscribe(
        (response) => {
          const newMatId = response.additionalMaterialId;
          const taskAnswerDTOToSend = {
            additionalMaterialId: newMatId,
            studentId: this.student.userId!,
            taskId: this.task$.taskId!,
            assignmentTime: new Date().toISOString(),
          };
          this.api
            .post<TaskAnswerDTO>('TaskAnswer', taskAnswerDTOToSend)
            .subscribe(
              (response) => {},
              (error) => {}
            );
        },
        (error) => {
          this.snackBar.open('Ошибка при загрузке файла', 'Закрыть', {
            duration: 3000,
          });
        }
      );
      const taskDTOToSend = {
        taskId: this.task$.taskId,
        postId: this.task$.postId,
        dueTime: this.task$.dueTime,
        subjectId: this.post$.subjectId,
        teacherId: this.post$.authorId,
        courseId: this.post$.courseId,
        taskStatus: TaskStatusEnum.Submitted,
        studentId: this.student.userId!,
        maxMark: this.task$.maxMark,
        mark: this.task$.mark,
        lastUpdate: this.task$.lastUpdate,
      };
      this.api
        .put<TaskDTO>('task', taskDTOToSend, taskDTOToSend.taskId!)
        .subscribe(
          (response) => {
            this.snackBar.open('Файл успешно загружен', 'Закрыть', {
              duration: 3000,
            });
          },
          (error) => {
            this.snackBar.open('Ошибка при загрузке файла', 'Закрыть', {
              duration: 3000,
            });
          }
        );
    }
  }

  removeFileFromServer(materialId: number) {
    // Удаляем файл
    this.api.delete('additionalmaterial', materialId).subscribe(() => {
      this.showToast('Файл успешно удален');
      const index = this.additionalMaterials$!.findIndex(
        (m) => m.additionalMaterialId === materialId
      );

      if (index !== -1) {
        this.additionalMaterials$!.splice(index, 1);
      }
      // Проверяем, есть ли еще файлы после удаления
      if (this.additionalMaterials$!.length === 0) {
        this.changePostStatusToAppointed();
      }
    });
  }

  private changePostStatusToAppointed() {
    const postId = this.post$.id; // Получаем ID поста

    const taskDTOToSend = {
      postId: this.task$.postId,
      dueTime: this.task$.dueTime,
      subjectId: this.post$.subjectId,
      teacherId: this.post$.authorId,
      courseId: this.post$.courseId,
      taskStatus: TaskStatusEnum.Appointed,
      studentId: this.student.userId!,
      maxMark: this.task$.maxMark,
      mark: this.task$.mark,
      lastUpdate: this.task$.lastUpdate,
    };

    // Отправляем запрос для изменения статуса
    this.api.put<TaskDTO>('task', taskDTOToSend, postId).subscribe(
      (response) => {},
      (error) => {}
    );
  }

  showToast(message: string) {
    // Логика отображения тост-сообщения
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

  getFileName(uri: string): string | undefined {
    if (!uri) return undefined;
    const fileName = uri.split('\\').pop(); // Получаем последнее слово в путис
    if (!fileName) return undefined;

    return fileName;
  }

  reloadPage() {
    window.location.reload();
  }

  private extractFileName(path: string): string {
    return path.split(/(\\|\/)/g).pop() || 'файл';
  }
}
