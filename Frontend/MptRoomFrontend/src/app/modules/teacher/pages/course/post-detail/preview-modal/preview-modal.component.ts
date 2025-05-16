import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../../../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'teacher-preview-modal',
  imports: [CommonModule],
  templateUrl: './preview-modal.component.html',
  styleUrl: './preview-modal.component.scss',
})
export class PreviewModalComponent {
  private _fileId?: number;
  @Input() set fileId(value: number | undefined) {
    if (value !== this._fileId) {
      this._fileId = value;
      if (value) this.loadFile(value);
    }
  }
  @Input() filepath: string = '';
  @Output() close = new EventEmitter<void>();

  previewType: 'image' | 'pdf' | 'office' | 'text' | 'unsupported' =
    'unsupported';
  safeFileUrl?: SafeResourceUrl;
  fileUrl: string = '';
  fileName: string = '';
  textContent: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  private subscriptions: Subscription = new Subscription();
  private blobUrl: string | null = null;

  constructor(private api: ApiService, private sanitizer: DomSanitizer) {}

  ngOnDestroy(): void {
    this.cleanupResources();
    this.subscriptions.unsubscribe();
  }

  private loadFile(fileId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscriptions.add(
      this.api.getAdditionalMaterials(fileId).subscribe({
        next: this.handleFileLoadSuccess.bind(this),
        error: this.handleFileLoadError.bind(this),
      })
    );
  }

  private handleFileLoadSuccess(blob: Blob): void {
    this.createBlobUrl(blob);
    this.fileName = this.extractFileName(this.filepath);
    this.determineFileType(blob);
    this.isLoading = false;
  }

  private handleFileLoadError(error: any): void {
    console.error('File load error:', error);
    this.errorMessage = 'Ошибка загрузки файла';
    this.isLoading = false;
    this.cleanupResources();
  }

  private createBlobUrl(blob: Blob): void {
    this.cleanupResources();
    this.blobUrl = URL.createObjectURL(blob);
    this.fileUrl = this.blobUrl;
  }

  private determineFileType(blob: Blob): void {
    const extension = (this.filepath.split('.').pop() || '').toLowerCase();
    const mimeType = blob.type;

    if (mimeType.startsWith('image/')) {
      this.previewType = 'image';
    } else if (mimeType === 'application/pdf') {
      this.previewType = 'pdf';
    } else if (this.isOfficeDocument(extension)) {
      this.handleOfficeDocument();
    } else if (extension === 'txt') {
      this.handleTextFile(blob);
    } else {
      this.previewType = 'unsupported';
    }
  }

  private isOfficeDocument(extension: string): boolean {
    return ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension);
  }

  private handleOfficeDocument(): void {
    this.previewType = 'office';
    this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://docs.google.com/gview?url=${encodeURIComponent(
        this.fileUrl
      )}&embedded=true`
    );
  }

  private handleTextFile(blob: Blob): void {
    this.previewType = 'text';
    const reader = new FileReader();
    reader.onload = (e) => {
      this.textContent = e.target?.result as string;
    };
    reader.readAsText(blob, 'UTF-8');
  }

  private extractFileName(path: string): string {
    if (!path) return '';
    const fileName = path.split('\\').pop(); // Получаем последнее слово в путис
    if (!fileName) return '';

    return fileName;
  }

  private cleanupResources(): void {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
    this.fileUrl = '';
    this.textContent = '';
    this.safeFileUrl = undefined;
  }

  closePreview(): void {
    this.cleanupResources();
    this.close.emit(); // Эмитим событие закрытия
    this.previewType = 'unsupported';
    this.errorMessage = '';
  }
}
