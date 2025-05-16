import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Observable,
  switchMap,
  forkJoin,
  take,
  map,
  firstValueFrom,
} from 'rxjs';
import { AdditionalMaterialDTO } from '../../../../../../models/DTO/additional-material.dto';
import { PersonalDataDTO } from '../../../../../../models/DTO/personal-data.dto';
import { PostThemeDTO } from '../../../../../../models/DTO/post-theme.dto';
import { PostDTO } from '../../../../../../models/DTO/post.dto';
import { StudentDTO } from '../../../../../../models/DTO/student.dto';
import { TaskDTO } from '../../../../../../models/DTO/task.dto';
import { TeacherDTO } from '../../../../../../models/DTO/teacher.dto';
import { UserBaseDTO } from '../../../../../../models/DTO/user-base.dto';
import { PostTypeEnum } from '../../../../../../models/enums/post-type.enum';
import { TaskStatusEnum } from '../../../../../../models/enums/task-status.enum';
import { CourseViewModel } from '../../../../../../models/VM/course.viewmode';
import { PostViewModel } from '../../../../../../models/VM/post.viewmodel';
import { TaskViewModel } from '../../../../../../models/VM/task.viewmodel';
import { ApiService } from '../../../../../../services/api.service';
import { CommonModule } from '@angular/common';
import { RussianDatePipe } from '../../../../../../helper/RussianDatePipe';
import { encodeId } from '../../../../../../helper/util';
import { Router } from '@angular/router';
import { PostContentComponent } from '../helper/PostContentComponent';

@Component({
  selector: 'teacher-task-card',
  imports: [CommonModule, RussianDatePipe],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
})
export class TaskCardComponent implements PostContentComponent {
  @Input() postId!: number;
  @Input() user!: TeacherDTO;
  @Input() course$!: Observable<CourseViewModel | null>;
  link = '';
  file?: File;
  submitted = false;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  selectedFiles: File[] = [];
  previewUrls: (string | undefined)[] = [];
  isDragging = false;
  user$!: TeacherDTO;
  post$!: PostViewModel;
  task$!: TaskViewModel;
  TaskStatusEnum = TaskStatusEnum;
  additionalMaterials$?: AdditionalMaterialDTO[];
  selectedFileId?: number;
  selectedFilePath?: string;

  totalSubmitted: number | null = null;
  totalAssigned: number | null = null;

  course!: CourseViewModel;

  constructor(
    private api: ApiService,
    private route: Router,
    private snackBar: MatSnackBar
  ) {}

  getExtraPostData() {
    return this.task$;
  }

  async ngOnInit() {
    await this.api.teacher$.subscribe((teacher) => {
      if (teacher) {
        this.user$ = teacher;
        this.postToViewModel(this.postId).subscribe((post) => {
          this.post$ = post;
          this.taskToViewModel(this.post$).subscribe((task) => {
            this.task$ = task;
            this.countSubmittedAndAssigned();
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

  getAdditionalMaterials(postId: number) {
    this.api
      .get<AdditionalMaterialDTO[]>(`AdditionalMaterial/task/${postId}`)
      .subscribe((mats) => {
        this.additionalMaterials$ = mats;
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
          map((tasks: TaskDTO[]) => {
            const task = tasks[0];
            if (!task) throw new Error('Нет данных task[0]');

            const viewModel: TaskViewModel = {
              postId: post.id,
              sidebarColor: course!.hexademicalColor,
              dueTime: task.dueTime,
              subjectName: post.theme,
              teacherName: post.author,
              taskName: post.title,
              taskStatus: task.taskStatus,
              mark: 0,
              maxMark: task.maxMark,
              description: post.description,
              lastUpdate: task.lastUpdate,
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

  async onViewSubmissions() {
    const course = await firstValueFrom(this.course$!);
    const courseHash = encodeId(course?.courseId!);
    const postHash = encodeId(this.post$.id);
    this.route.navigate(['teacher', 'course', courseHash, postHash, 'marks']);
  }

  private countSubmittedAndAssigned() {
    this.api
      .get<any[]>(`task/post/${this.task$.postId}`)
      .subscribe((submissions) => {
        this.totalAssigned = submissions.length;
        this.totalSubmitted = submissions.filter(
          (s) =>
            s.taskStatus === TaskStatusEnum.Submitted ||
            s.taskStatus === TaskStatusEnum.ReturnedWithMark
        ).length;
      });
  }
}
