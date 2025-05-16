import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { PostDTO } from '../../../../../../models/DTO/post.dto';
import { PostTypeEnum } from '../../../../../../models/enums/post-type.enum';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostThemeDTO } from '../../../../../../models/DTO/post-theme.dto';
import { ApiService } from '../../../../../../services/api.service';
import { TaskDTO } from '../../../../../../models/DTO/task.dto';
import { SurveyOptionDTO } from '../../../../../../models/DTO/survey-option.dto';
import { AdditionalMaterialDTO } from '../../../../../../models/DTO/additional-material.dto';
import { forkJoin } from 'rxjs';
import flatpickr from 'flatpickr';
import { Russian } from 'flatpickr/dist/l10n/ru.js';

@Component({
  selector: 'teacher-post-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-modal.component.html',
  styleUrl: './post-modal.component.scss',
})
export class PostModalComponent {
  @Input() post: PostDTO | null = null;
  @Input() postType: PostTypeEnum | null = null;
  @Input() isEdit: boolean = false;
  @Input() postThemes!: PostThemeDTO[];
  @Input() TaskDTO?: TaskDTO;
  @Input() SurveyOptions?: SurveyOptionDTO[];
  @Input() AdditionalMaterials?: AdditionalMaterialDTO[];
  @Output() close = new EventEmitter<void>();
  @Output() savePost = new EventEmitter<any>();
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  selectedThemeId?: number;
  showNewThemeInput = false;
  newThemeText = '';
  postTypeEnum = PostTypeEnum;

  selectedPost: any = { postThemeId: null };
  NEW_THEME_ID = -1;

  surveyOptions: string[] = [];
  newSurveyOption = '';

  dueDate: string = ''; // '2025-05-06'
  dueTime: string = ''; // '10:30'

  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  isDragging = false;

  constructor(private api: ApiService) {}

  @ViewChild('dueDateInput') dueDateInput!: ElementRef;
  @ViewChild('dueTimeInput') dueTimeInput!: ElementRef;

  ngOnInit(): void {
    if (this.post) {
      this.selectedPost = { ...this.post };
      this.postType = this.post.postType;
      if (this.isEdit) {
        switch (this.postType) {
          case PostTypeEnum.Task:
            if (this.TaskDTO?.dueTime) {
              const localDate = new Date(this.TaskDTO.dueTime);
              this.dueDate = localDate.toISOString().slice(0, 10); // yyyy-MM-dd
              this.dueTime = localDate.toTimeString().slice(0, 5); // HH:mm
              this.selectedPost.maxMark = this.TaskDTO.maxMark;
            }
            break;

          case PostTypeEnum.Survey:
            if (this.SurveyOptions) {
              this.surveyOptions = this.SurveyOptions.map((o) => o.optionName);
            }
            break;

          case PostTypeEnum.AdditionalMaterials:
            if (this.AdditionalMaterials?.length) {
              const requests = this.AdditionalMaterials.map((f) =>
                this.api.getAdditionalMaterials(f.additionalMaterialId!)
              );

              forkJoin(requests).subscribe({
                next: (blobs: Blob[]) => {
                  this.previewUrls = blobs.map((blob) =>
                    URL.createObjectURL(blob)
                  );
                },
                error: (err) => {
                  console.error('Ошибка при загрузке материалов:', err);
                },
              });
            }
            break;
        }
      }
    }
    setTimeout(() => {
      setTimeout(() => {
        flatpickr(this.dueDateInput.nativeElement, {
          minDate: 'today',
          dateFormat: 'Y-m-d',
          locale: Russian,
          defaultDate: this.dueDate,
        });

        flatpickr(this.dueTimeInput.nativeElement, {
          enableTime: true,
          noCalendar: true,
          dateFormat: 'H:i',
          time_24hr: true,
          defaultDate: this.dueTime,
        });
      }, 100);
    });
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    if (!event.dataTransfer?.files) return;
    this.handleFiles(event.dataTransfer.files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(): void {
    this.isDragging = false;
  }

  onClickFileInput(): void {
    this.fileInputRef.nativeElement.click();
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    this.handleFiles(files);
  }

  handleFiles(files: FileList): void {
    Array.from(files).forEach((file) => {
      this.selectedFiles.push(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e: any) => this.previewUrls.push(e.target.result);
        reader.readAsDataURL(file);
      } else {
        this.previewUrls.push('');
      }
    });
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  onThemeChange(event: Event): void {
    const value = +(event.target as HTMLSelectElement).value;
    this.selectedThemeId = value;
    this.showNewThemeInput = value === this.NEW_THEME_ID;
    if (!this.showNewThemeInput) this.newThemeText = '';
  }

  addSurveyOption(): void {
    const trimmed = this.newSurveyOption.trim();
    if (trimmed && !this.surveyOptions.includes(trimmed)) {
      this.surveyOptions.push(trimmed);
      this.newSurveyOption = '';
    }
  }

  removeSurveyOption(index: number): void {
    this.surveyOptions.splice(index, 1);
  }

  getUtcDueDateTime(): string | null {
    if (!this.dueDate || !this.dueTime) return null;

    const local = new Date(`${this.dueDate}T${this.dueTime}`);
    return local.toISOString(); // уже в UTC
  }

  save(form: any): void {
    if (form.invalid) return;
    const dueDateTimeUtc = this.getUtcDueDateTime();
    const formValue = {
      ...form.value,
      maxMark: this.selectedPost.maxMark,
      files: this.selectedFiles,
      dueTime: dueDateTimeUtc,
      newThemeText: this.newThemeText,
      type: this.postType,
      surveyOptions:
        this.postType === PostTypeEnum.Survey ? this.surveyOptions : [],
      postThemeId: this.showNewThemeInput
        ? this.NEW_THEME_ID
        : this.selectedThemeId,
    };

    this.savePost.emit(formValue);
    this.cancel();
  }

  cancel(): void {
    this.close.emit();
  }
}
