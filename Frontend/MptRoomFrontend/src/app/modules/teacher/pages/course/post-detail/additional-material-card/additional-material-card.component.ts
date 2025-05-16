import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { AdditionalMaterialDTO } from '../../../../../../models/DTO/additional-material.dto';
import { StudentDTO } from '../../../../../../models/DTO/student.dto';
import { ApiService } from '../../../../../../services/api.service';
import { CommonModule } from '@angular/common';
import { PreviewModalComponent } from '../preview-modal/preview-modal.component';
import { TeacherDTO } from '../../../../../../models/DTO/teacher.dto';
import { matSnackBarAnimations } from '@angular/material/snack-bar';
import { PostContentComponent } from '../helper/PostContentComponent';

@Component({
  selector: 'teacher-additional-material-card',
  imports: [CommonModule, PreviewModalComponent],
  templateUrl: './additional-material-card.component.html',
  styleUrl: './additional-material-card.component.scss',
})
export class AdditionalMaterialCardComponent implements PostContentComponent {
  @Input() postId!: number;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  additionalMaterials$?: AdditionalMaterialDTO[];
  selectedFileId?: number;
  selectedFilePath?: string;
  previewUrl?: string;
  selectedFiles: File[] = [];
  isDragging = false;
  user$!: TeacherDTO;
  previewUrls: (string | undefined)[] = [];
  link = '';
  file?: File;

  constructor(private api: ApiService) {}

  getExtraPostData() {
    return this.additionalMaterials$;
  }

  async ngOnInit() {
    await this.api.teacher$.subscribe((teacher) => {
      if (teacher) {
        this.user$ = teacher;
        this.getAdditionalMaterials(this.postId);
      }
    });
  }

  getAdditionalMaterials(postId: number) {
    this.api
      .get<AdditionalMaterialDTO[]>(`AdditionalMaterial/post/${postId}`)
      .subscribe((mats) => {
        this.additionalMaterials$ = mats;
      });
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
    const fileName = uri.split('/').pop(); // Получаем последнее слово в пути
    if (!fileName) return undefined;

    return fileName;
  }

  reloadPage() {
    window.location.reload();
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
    });
  }
  showToast(arg0: string) {
    throw new Error('Method not implemented.');
  }
}
