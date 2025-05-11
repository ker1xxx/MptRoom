import { Component, OnInit } from '@angular/core';
import { CourseViewModel } from '../../../../models/VM/course.viewmode';
import { ApiService } from '../../../../services/api.service';
import { CourseDTO } from '../../../../models/DTO/course.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { forkJoin, map, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminHeaderComponent } from '../../shared/header/header.component';
import { AuthorizationDataDTO } from '../../../../models/DTO/authorization-data.dto';
import { TeacherViewModel } from '../../../../models/VM/teacher.viewmodel';
import { ActivatedRoute, Router } from '@angular/router';
import { PostViewModel } from '../../../../models/VM/post.viewmodel';

@Component({
  selector: 'admin-course-management',
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  templateUrl: './course-page.component.html',
  styleUrls: ['./course-page.component.scss'],
})
export class CoursePageComponent implements OnInit {
  courses: CourseViewModel[] = [];
  isModalOpen: boolean = false;
  isEditMode: boolean = false;
  selectedCourse: CourseViewModel | null = null;
  filteredCourses: CourseViewModel[] = [];
  groups: GroupDTO[] = [];
  subjects: SubjectDTO[] = [];
  teachers: TeacherViewModel[] = [];
  filter = {
    groupId: '',
    teacherId: '',
    subjectId: '',
  };

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const teacherId = params['teacherId'] ? +params['teacherId'] : null;
      const subjectId = params['subjectId'] ? +params['subjectId'] : null;
      const groupId = params['groupId'] ? +params['groupId'] : null;
      this.filter = {
        groupId: groupId ? String(groupId) : '',
        teacherId: teacherId ? String(teacherId) : '',
        subjectId: subjectId ? String(subjectId) : '',
      };
    });
    this.loadCourses();
    this.loadGroups();
    this.loadSubjects();
    this.loadTeachers();
  }
  loadGroups() {
    this.apiService.get<GroupDTO[]>('Group').subscribe((groups) => {
      this.groups = groups;
    });
  }
  loadSubjects() {
    this.apiService.get<SubjectDTO[]>('Subject').subscribe((subjects) => {
      this.subjects = subjects;
    });
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

  loadCourses() {
    // Загружаем все курсы
    this.apiService.get<CourseDTO[]>('Course').subscribe({
      next: (data) => {
        // Преобразуем каждый курс
        this.courses = [];
        const courseObservables = data.map((courseDTO) => {
          const courseViewModel = this.mapCourseDTOtoViewModel(courseDTO);

          // Массив запросов для получения данных
          const group$ = this.apiService.get<GroupDTO>(
            `Group/${courseDTO.groupId}`
          );
          const subject$ = this.apiService.getById<SubjectDTO>(
            'Subject',
            courseDTO.subjectId
          );
          const teacher$ = this.apiService.get<TeacherDTO>(
            `Teacher/${courseDTO.teacherId}`
          );

          // Собираем все запросы в forkJoin
          return forkJoin([group$, subject$, teacher$]).subscribe({
            next: ([group, subject, teacher]) => {
              // После завершения всех запросов обновляем данные курса
              courseViewModel.groupName = group.groupName;
              courseViewModel.groupId = group.groupId;
              courseViewModel.courseName = `${group.groupName} - ${subject.subjectName}`;
              courseViewModel.subjectName = subject.subjectName;
              courseViewModel.subjectId = subject.subjectId!;
              courseViewModel.hexademicalColor = subject.hexademicalColor;

              // Получаем данные о преподавателе
              this.apiService
                .getById<PersonalDataDTO>(
                  'PersonalData',
                  teacher.personalDataId!
                )
                .subscribe((personalData) => {
                  courseViewModel.teacherName = `${personalData.lastname} ${personalData.name}`;
                });

              // Добавляем завершенный объект в список курсов
              this.courses.push(courseViewModel);
              this.applyFilters();
            },
            error: (err) =>
              console.error('Ошибка загрузки данных о курсе:', err),
          });
        });
      },
      error: (err) => console.error('Ошибка загрузки курсов:', err),
    });
  }

  applyFilters() {
    this.filteredCourses = this.courses.filter((course) => {
      const groupId = Number(this.filter.groupId);
      const teacherId = Number(this.filter.teacherId);
      const subjectId = Number(this.filter.subjectId);
      return (
        (!groupId || course.groupId === groupId) &&
        (!teacherId || course.teacherId === teacherId) &&
        (!subjectId || course.subjectId === subjectId)
      );
    });
  }

  // Преобразование из DTO в ViewModel
  mapCourseDTOtoViewModel(courseDTO: any): CourseViewModel {
    // Преобразование DTO в ViewModel
    return {
      courseId: courseDTO.courseId,
      courseName: courseDTO.courseName,
      groupId: courseDTO.groupId,
      groupName: courseDTO.groupName,
      subjectId: courseDTO.subjectId,
      subjectName: courseDTO.subjectName,
      teacherId: courseDTO.teacherId,
      teacherName: courseDTO.teacherName,
      hexademicalColor: courseDTO.hexademicalColor,
    };
  }

  openModal(course?: CourseViewModel) {
    if (course) {
      // Если курс передан, то копируем его данные в selectedCourse для редактирования
      this.selectedCourse = { ...course };
      this.isEditMode = true;
    } else {
      // Если курс не передан, создаем новый объект с пустыми значениями для обязательных свойств
      this.selectedCourse = {
        courseName: '',
        groupName: '',
        subjectName: '',
        teacherName: '',
        subjectId: 0, // Добавляем обязательные поля
        teacherId: 0, // Добавляем обязательные поля
        hexademicalColor: '', // Добавляем обязательные поля
      };
      this.isEditMode = false;
    }
    this.isModalOpen = true;
  }

  saveCourse() {
    if (this.isEditMode) {
      // Редактирование курса
      this.apiService
        .put<CourseDTO>(
          'Course',
          this.selectedCourse!,
          this.selectedCourse!.courseId!
        )
        .subscribe(() => {
          this.loadCourses();
          this.closeModal();
        });
    } else {
      // Создание нового курса
      this.apiService.post('Course', this.selectedCourse).subscribe(() => {
        this.loadCourses();
        this.closeModal();
      });
    }
  }
  closeModal() {
    this.isModalOpen = false;
  }

  deleteCourse(courseId: number) {
    this.apiService.delete('Course', courseId).subscribe(() => {
      this.loadCourses();
      this.closeModal();
    });
  }
}
