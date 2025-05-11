import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { StudentViewModel } from '../../../../models/VM/student.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { switchMap, forkJoin, map, tap, Observable } from 'rxjs';
import { AuthorizationDataDTO } from '../../../../models/DTO/authorization-data.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { TableHeader } from '../../../../models/helpers/table-header.model';
import { FormsModule } from '@angular/forms';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { ActivatedRoute, Router } from '@angular/router';
import { CollegeYearEnum } from '../../../../models/enums/college-year.enum';
import { AdminHeaderComponent } from '../../shared/header/header.component';

@Component({
  selector: 'admin-users-page',
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss',
})
export class UsersPageComponent {
  students: StudentViewModel[] = [];
  headers: TableHeader<StudentViewModel>[] = [
    { key: 'name', displayName: 'Имя' },
    { key: 'lastname', displayName: 'Фамилия' },
    { key: 'patronymic', displayName: 'Отчество' },
    { key: 'phoneNumber', displayName: 'Телефон' },
    { key: 'email', displayName: 'Email' },
    { key: 'login', displayName: 'Логин' },
    { key: 'groupName', displayName: 'Группа' },
  ];

  editableFields: TableHeader<StudentViewModel>[] = [
    { key: 'name', displayName: 'Имя' },
    { key: 'lastname', displayName: 'Фамилия' },
    { key: 'patronymic', displayName: 'Отчество' },
    { key: 'phoneNumber', displayName: 'Телефон' },
    { key: 'email', displayName: 'Email' },
    { key: 'groupName', displayName: 'Группа' },
  ];
  collegeYear: { [key: number]: string } = {
    [CollegeYearEnum.First]: 'Первый курс',
    [CollegeYearEnum.Second]: 'Второй курс',
    [CollegeYearEnum.Third]: 'Третий курс',
    [CollegeYearEnum.Fourth]: 'Четвертый курс',
  };
  isModalOpen = false;
  selectedItem: StudentViewModel | null = null;
  filteredStudents: StudentViewModel[] = [];
  allGroups: GroupDTO[] = [];
  selectedGroupId?: number;

  originalStudentsDTO: StudentDTO[] = [];

  originalAuthData?: AuthorizationDataDTO;

  isEditMode: boolean = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  ngOnInit() {
    forkJoin([
      this.api.get<StudentDTO[]>('Student').pipe(
        tap((dtos) => (this.originalStudentsDTO = dtos)), // сохраняем оригинальные DTO
        switchMap((dtos) => this.convertToViewModels(dtos))
      ),
      this.api.get<GroupDTO[]>('Group'),
    ]).subscribe(([viewModels, groups]) => {
      this.students = viewModels;
      this.allGroups = groups;
      this.applyFilters();
    });

    this.route.queryParams.subscribe((params) => {
      this.selectedGroupId = params['group'] ? +params['group'] : undefined;
      this.applyFilters();
    });
  }

  private applyFilters() {
    this.filteredStudents = this.selectedGroupId
      ? this.students.filter((s) => s.groupId === this.selectedGroupId)
      : [...this.students];
  }

  onGroupChange(groupId?: number) {
    this.router.navigate([], {
      queryParams: { group: groupId || null },
      queryParamsHandling: 'merge',
    });
  }

  clearFilter() {
    this.onGroupChange(undefined);
  }

  private convertToViewModels(
    dtos: StudentDTO[]
  ): Observable<StudentViewModel[]> {
    const requests = dtos.map((dto) =>
      forkJoin({
        personalData: this.api.getById<PersonalDataDTO>(
          'PersonalData',
          dto.personalDataId!
        ),
        authData: this.api.getById<AuthorizationDataDTO>(
          'AuthorizationData',
          dto.authorizationDataId!
        ),
        groupData: this.api.getById<GroupDTO>('Group', dto.groupId),
      }).pipe(
        map(({ personalData, authData, groupData }) => ({
          userId: dto.userId!,
          name: personalData.name,
          lastname: personalData.lastname,
          patronymic: personalData.patronymic || '',
          phoneNumber: personalData.phoneNumber,
          email: personalData.email,
          login: authData.login,
          groupId: dto.groupId,
          groupName: groupData.groupName,
        }))
      )
    );
    return forkJoin(requests);
  }

  saveChanges() {
    if (this.selectedItem?.userId != 0) {
      // Обновление существующего студента
      this.updateStudent();
    } else {
      // Добавление нового студента
      this.addNewStudent();
    }
  }
  private addNewStudent() {
    // Создаем DTO для нового студента
    const newStudentDTO: StudentDTO = {
      groupId: this.selectedItem!.groupId,
      personalDataId: 0, // Это ID будет назначаться на сервере
      authorizationDataId: 0, // Это ID будет назначаться на сервере
    };

    forkJoin([
      // Отправляем запросы для создания данных личной информации и авторизации
      this.api.post<PersonalDataDTO>('PersonalData', {
        name: this.selectedItem!.name,
        lastname: this.selectedItem!.lastname,
        patronymic: this.selectedItem!.patronymic,
        phoneNumber: this.selectedItem!.phoneNumber,
        email: this.selectedItem!.email,
      }),
      this.api.post<AuthorizationDataDTO>('AuthorizationData', {
        login: this.selectedItem!.login,
        password: this.selectedItem!.password!, // Добавьте пароль в модель, если нужно
      }),
    ]).subscribe(([personalDataResponse, authDataResponse]) => {
      newStudentDTO.personalDataId = personalDataResponse.personalDataId;
      newStudentDTO.authorizationDataId = authDataResponse.authorizationDataId;

      // Теперь отправляем данные на создание студента
      this.api
        .post<StudentDTO>('Student', newStudentDTO)
        .subscribe((createdStudent) => {
          // Обновляем локальный список студентов
          const newViewModel = this.convertToViewModel(createdStudent, {
            userId: createdStudent.userId,
            groupId: createdStudent.groupId,
            name: createdStudent.name,
            lastname: createdStudent.lastname,
            patronymic: createdStudent.patronymic,
            phoneNumber: createdStudent.phoneNumber,
            email: createdStudent.email,
            login: createdStudent.login,
            password: createdStudent.password,
            groupName: createdStudent.groupName,
          });

          this.students.push(newViewModel);
          this.closeModal();
        });
    });
  }

  private convertToViewModel(
    dto: StudentDTO,
    vm: StudentViewModel
  ): StudentViewModel {
    return {
      ...vm,
      groupId: dto.groupId,
    };
  }

  openModal(item?: StudentViewModel) {
    if (item && item.userId !== undefined) {
      this.selectedItem = { ...item };
      this.isEditMode = true;
    } else {
      this.selectedItem = {
        userId: 0,
        groupId: this.selectedGroupId || 0,
        name: '',
        lastname: '',
        patronymic: '',
        phoneNumber: '',
        email: '',
        login: '',
        groupName: '',
      };
      this.isEditMode = false;
    }
    this.isModalOpen = true;
  }

  private updateStudent() {
    if (!this.selectedItem) return;

    const originalDTO = this.originalStudentsDTO.find(
      (dto) => dto.userId === this.selectedItem!.userId
    );

    if (!originalDTO) {
      console.error('Original DTO not found');
      return;
    }

    const updateDTO: StudentDTO = {
      ...originalDTO,
      groupId: this.selectedItem.groupId,
    };

    forkJoin([
      this.api.put<PersonalDataDTO>(
        'PersonalData',
        {
          personalDataId: originalDTO.personalDataId,
          name: this.selectedItem.name,
          lastname: this.selectedItem.lastname,
          patronymic: this.selectedItem.patronymic,
          phoneNumber: this.selectedItem.phoneNumber,
          email: this.selectedItem.email,
        },
        this.originalAuthData?.authorizationDataId!
      ),
      this.api.put<StudentDTO>('Student', updateDTO, updateDTO.userId!),
    ]).subscribe(() => {
      const updatedVM = this.convertToViewModel(updateDTO, this.selectedItem!);
      this.students = this.students.map((item) =>
        item.userId === updatedVM.userId ? updatedVM : item
      );
      this.applyFilters(); // на случай если фильтры заданы
      this.closeModal();
    });
  }

  closeModal() {
    this.isModalOpen = false;
  }

  deleteStudent(userId: number) {
    if (confirm('Удалить студента?')) {
      this.api.delete('Student', userId).subscribe();
      this.closeModal();
    }
  }
}
