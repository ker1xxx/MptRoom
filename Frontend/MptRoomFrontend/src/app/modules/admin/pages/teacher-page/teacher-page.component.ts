import { Component } from '@angular/core';
import { TeacherViewModel } from '../../../../models/VM/teacher.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { forkJoin, Observable, map } from 'rxjs';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { AuthorizationDataDTO } from '../../../../models/DTO/authorization-data.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminHeaderComponent } from '../../shared/header/header.component';
import { Router } from '@angular/router';

@Component({
  selector: 'admin-teacher-page',
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  templateUrl: './teacher-page.component.html',
  styleUrl: './teacher-page.component.scss',
})
export class TeacherPageComponent {
  teachers: TeacherViewModel[] = [];
  isModalOpen = false;
  isEditMode = false;
  selectedTeacher: TeacherViewModel | null = null;

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadTeachers();
  }

  loadTeachers() {
    this.apiService.get<TeacherDTO[]>('Teacher').subscribe({
      next: (teacherDTOs) => {
        const requests = teacherDTOs.map((dto) =>
          this.buildTeacherViewModel(dto)
        );
        forkJoin(requests).subscribe({
          next: (teachers) => (this.teachers = teachers),
          error: (err) => console.error('Ошибка загрузки преподавателей:', err),
        });
      },
      error: (err) =>
        console.error('Ошибка получения DTO преподавателей:', err),
    });
  }

  authorizationData?: AuthorizationDataDTO;
  oldPersonalData?: PersonalDataDTO;

  private buildTeacherViewModel(dto: TeacherDTO): Observable<TeacherViewModel> {
    return forkJoin({
      personalData: this.apiService.getById<PersonalDataDTO>(
        'PersonalData',
        dto.personalDataId!
      ),
      authorizationData: this.apiService.getById<AuthorizationDataDTO>(
        'AuthorizationData',
        dto.authorizationDataId!
      ),
      subjects: this.apiService.get<SubjectDTO[]>(
        `Subject/teacher/${dto.userId}`
      ), // добавь такой метод на бэке
    }).pipe(
      map(({ personalData, authorizationData, subjects }) => ({
        userId: dto.userId ?? 0,
        name: personalData.name,
        lastname: personalData.lastname,
        patronymic: personalData.patronymic,
        phoneNumber: personalData.phoneNumber,
        email: personalData.email,
        login: authorizationData.login,
        password: '', // пароль не возвращается
        subjects: subjects || [],
        personalDataId: personalData.personalDataId,
        authorizationDataId: authorizationData.authorizationDataId,
      }))
    );
  }

  openModal(teacher?: TeacherViewModel) {
    this.isEditMode = !!teacher;
    this.selectedTeacher = teacher
      ? JSON.parse(JSON.stringify(teacher))
      : {
          userId: 0,
          name: '',
          lastname: '',
          patronymic: '',
          phoneNumber: '',
          email: '',
          login: '',
          password: '',
          subjects: [],
        };
    this.isModalOpen = true;
  }

  closeModal() {
    this.selectedTeacher = null;
    this.isModalOpen = false;
  }

  saveTeacher() {
    if (this.isEditMode && this.selectedTeacher?.userId) {
      // Если это режим редактирования, то обновляем персональные данные, а потом сохраняем преподавателя
      const personalDataDTO = {
        personalDataId: this.selectedTeacher.personalDataId,
        name: this.selectedTeacher.name,
        lastname: this.selectedTeacher.lastname,
        patronymic: this.selectedTeacher.patronymic,
        phoneNumber: this.selectedTeacher.phoneNumber,
        email: this.selectedTeacher.email,
      };

      this.apiService
        .put<PersonalDataDTO>(
          'PersonalData',
          personalDataDTO,
          this.selectedTeacher.personalDataId!
        )
        .subscribe({
          next: (personalDataResponse) => {
            // Обновляем TeacherDTO
            const teacherDTO = {
              userId: this.selectedTeacher!.userId,
              personalDataId: this.selectedTeacher?.personalDataId,
              authorizationDataId: this.selectedTeacher!.authorizationDataId,
            };

            this.apiService
              .put<TeacherDTO>(
                'Teacher',
                teacherDTO,
                this.selectedTeacher!.userId
              )
              .subscribe(() => {
                this.loadTeachers();
                this.closeModal();
              });
          },
          error: (err) =>
            console.error('Ошибка сохранения персональных данных:', err),
        });
    } else {
      // Если это режим создания, сначала сохраняем персональные данные
      const personalDataDTO = {
        name: this.selectedTeacher!.name,
        lastname: this.selectedTeacher!.lastname,
        patronymic: this.selectedTeacher!.patronymic,
        phoneNumber: this.selectedTeacher!.phoneNumber,
        email: this.selectedTeacher!.email,
      };

      this.apiService
        .post<PersonalDataDTO>('PersonalData', personalDataDTO)
        .subscribe({
          next: (personalDataResponse) => {
            // Теперь сохраняем преподавателя, передаем DTO
            const authroizationDataDTO = {
              login: this.selectedTeacher?.login!,
              password: this.selectedTeacher?.password!,
            };
            this.apiService
              .post<AuthorizationDataDTO>(
                'AuthorizationData',
                authroizationDataDTO
              )
              .subscribe({
                next: (authorizationData) => {
                  const teacherDTO = {
                    personalDataId: personalDataResponse.personalDataId,
                    authorizationDataId: authorizationData.authorizationDataId,
                  };

                  this.apiService
                    .post<TeacherDTO>('Teacher', teacherDTO)
                    .subscribe({
                      next: () => {
                        this.loadTeachers();
                        this.closeModal();
                      },
                      error: (err) =>
                        console.error('Ошибка создания преподавателя:', err),
                    });
                },
              });
          },
          error: (err) =>
            console.error('Ошибка сохранения персональных данных:', err),
        });
    }
  }

  deleteTeacher(userId: number) {
    if (confirm('Удалить преподавателя?')) {
      this.apiService.delete('Teacher', userId).subscribe(() => {
        this.loadTeachers();
        this.closeModal();
      });
    }
  }

  showCourses(teacher_id?: number) {
    this.router.navigate(['admin/courses'], {
      queryParams: { teacher: teacher_id },
      queryParamsHandling: 'merge',
    });
  }
  showPosts(teacher_id?: number) {
    this.router.navigate(['admin/posts']);
  }
}
