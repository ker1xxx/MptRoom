import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImageCroppedEvent, ImageCropperComponent } from 'ngx-image-cropper';
import { ApiService } from '../../../services/api.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'avatar-modal',
  imports: [CommonModule, ImageCropperComponent],
  templateUrl: './avatar-modal.component.html',
  styleUrl: './avatar-modal.component.scss',
})
export class AvatarModalComponent {
  @Input() userId!: number;
  @Output() close = new EventEmitter<void>();
  @Output() avatarUpdated = new EventEmitter<void>();

  constructor(
    private api: ApiService,
    private notificationService: NotificationService
  ) {}

  isDragging = false;
  imageChangedEvent: any = '';
  croppedImage: any = '';

  fileToUpload: File | null = null;

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    if (event.dataTransfer?.files?.length) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  handleFiles(files: File[]) {
    const file = files[0];

    if (!file.type.startsWith('image/')) {
      this.notificationService.show(
        '❌ Файл не является изображением',
        'error'
      );
      return;
    }

    this.fileToUpload = file;

    // Создаём FileList вручную (нельзя напрямую создать FileList, но можно использовать DataTransfer)
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    // Создаём кастомное событие выбора файла
    const fakeInput = document.createElement('input');
    fakeInput.type = 'file';
    fakeInput.files = dataTransfer.files;

    this.imageChangedEvent = { target: fakeInput } as any;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.objectUrl; // для предпросмотра
    this.fileToUpload = new File([event.blob!], 'avatar.png', {
      type: event.blob!.type,
    });
  }

  base64ToFile(base64: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], 'avatar.png', { type: mime });
  }

  uploadAvatar() {
    if (!this.fileToUpload) return;

    const formData = new FormData();
    formData.append('file', this.fileToUpload);
    formData.append('userId', this.userId.toString());

    this.api.post('PersonalData/avatar', formData).subscribe({
      next: () => {
        this.notificationService.show('✅ Аватар успешно обновлён', 'success');
        this.avatarUpdated.emit();
        this.close.emit();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      error: (err) => {
        console.error(err);
        this.notificationService.show(
          '❌ Ошибка при загрузке аватара',
          'error'
        );
      },
    });
  }
}
