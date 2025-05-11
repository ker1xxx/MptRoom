import { Component } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import {
  Observable,
  Subject,
  takeUntil,
  map,
  forkJoin,
  firstValueFrom,
} from 'rxjs';
import { AuthorizationDataDTO } from '../../../../models/DTO/authorization-data.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { TaskViewModel } from '../../../../models/VM/task.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { TeacherViewModel } from '../../../../models/VM/teacher.viewmodel';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarModalComponent } from '../../../shared/avatar-modal/avatar-modal.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-personal',
  imports: [CommonModule, FormsModule, AvatarModalComponent, HeaderComponent],
  templateUrl: './personal.component.html',
  styleUrl: './personal.component.scss',
})
export class TeacherPersonalComponent {
  teacher!: TeacherDTO;
  unsubmittedWorksCount$!: Observable<number>;
  unsubmittedTasks$!: Observable<TaskViewModel[] | null>;
  tasks$!: Observable<TaskDTO[]>;
  teacherVM$!: Observable<TeacherViewModel>;
  avatarUrl: SafeResourceUrl | string =
    'assets/images/user_icon_not_found_100px.png';
  showAvatarModal = false;

  private destroy$ = new Subject<void>();

  averageGrade: number | null = null;
  newPassword: string = '';
  selectedSubjectId: number | null = null;

  constructor(
    private api: ApiService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.api.teacher$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (teacher) => {
        if (!teacher) return;

        this.teacher = teacher;
        this.api.avatarUrlCache.subscribe((url) => {
          this.avatarUrl = url;
        });
        this.teacherVM$ = this.convertToViewModels(teacher);
      },
      error: (err) => console.error('teacher load error:', err),
    });
  }

  async changePassword() {
    if (!this.newPassword.trim()) return;
    const teacher = await firstValueFrom(this.teacherVM$);
    const authorizationDataDTO: AuthorizationDataDTO = {
      authorizationDataId: teacher.authorizationDataId!,
      login: teacher.login,
      password: this.newPassword,
    };
    this.api
      .put(
        'AuthorizationData',
        authorizationDataDTO,
        authorizationDataDTO.authorizationDataId!
      )
      .subscribe({
        next: () => {
          this.notificationService.show(
            '✅ Пароль успешно обновлён',
            'success'
          );

          this.newPassword = '';
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        error: (err) => {
          console.error(err);
          this.notificationService.show(
            '❌ Ошибка при изменении пароля',
            'error'
          );
        },
      });
  }

  onAvatarChange() {
    this.showAvatarModal = true;
  }

  onAvatarModalClosed() {
    this.showAvatarModal = false;
    // Перезагрузить аватарку (если нужно)
  }

  private convertToViewModels(dto: TeacherDTO): Observable<TeacherViewModel> {
    return forkJoin({
      personalData: this.api.getById<PersonalDataDTO>(
        'PersonalData',
        dto.personalDataId!
      ),
      authData: this.api.getById<AuthorizationDataDTO>(
        'AuthorizationData',
        dto.authorizationDataId!
      ),
      subjects: this.api.get<SubjectDTO[]>(`Subject/teacher/${dto.userId!}`),
    }).pipe(
      map(({ personalData, authData, subjects }) => ({
        userId: dto.userId!,
        name: personalData.name,
        lastname: personalData.lastname,
        patronymic: personalData.patronymic || '',
        phoneNumber: personalData.phoneNumber,
        email: personalData.email,
        login: authData.login,
        password: authData.password,
        subjects: subjects,
        personalDataId: personalData.personalDataId,
        avatarAbsoluteUri: personalData.avatarAbsoluteUri,
      }))
    );
  }

  ngOnDestroy(): void {
    if (this.avatarUrl && typeof this.avatarUrl === 'string') {
      URL.revokeObjectURL(this.avatarUrl);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
