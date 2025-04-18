import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LessonDTO } from '../../../../models/DTO/lesson.dto';
import { DayOfWeekEnum } from '../../../../models/enums/day-of-week.enum';
import { WeekTypeEnum } from '../../../../models/enums/week-type.enum';
import { LessonViewModel } from '../../../../models/VM/lesson.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { forkJoin, Observable, map, switchMap, of } from 'rxjs';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { HousingDTO } from '../../../../models/DTO/housing.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { LessonSlotDTO } from '../../../../models/DTO/lesson-slot.dto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherViewModel } from '../../../../models/VM/teacher.viewmodel';
import { AuthorizationDataDTO } from '../../../../models/DTO/authorization-data.dto';
import { AdminHeaderComponent } from '../../shared/header/header.component';

@Component({
  selector: 'app-lesson-page',
  imports: [CommonModule, FormsModule, AdminHeaderComponent],
  templateUrl: './lesson-page.component.html',
  styleUrl: './lesson-page.component.scss',
})
export class LessonScheduleComponent implements OnInit {
  lessons: LessonViewModel[] = [];
  daysOfWeek = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
  ];
  daysOfWeekOriginal = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  daysOfWeekNumbers = [1, 2, 3, 4, 5, 6];
  lessonsPerDay = 5;
  filter = {
    groupId: '',
    subjectId: '',
    teacherId: '',
  };
  lessonNumbers = [1, 2, 3, 4, 5];

  filteredLessons: LessonViewModel[] = [];

  isLessonModalOpen = false;
  selectedDay?: number;
  selectedLessonNumber?: number;
  addLessonError: string = '';

  isEditMode = false;

  newLesson: Partial<LessonDTO> = {
    subjectId: 0,
    groupId: 0,
    teacherId: 0,
    housingId: 0,
    weekType: 0,
  };

  weekTypes = [
    { value: WeekTypeEnum.any, label: 'Каждую неделю' },
    { value: WeekTypeEnum.odd, label: 'Числитель' },
    { value: WeekTypeEnum.even, label: 'Знаменатель' },
  ];

  teachers: TeacherViewModel[] = [];
  groups: GroupDTO[] = [];
  housings: HousingDTO[] = [];
  subjects: SubjectDTO[] = [];

  selectedWeekType: WeekTypeEnum | null = null;

  constructor(
    private apiService: ApiService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLessons();
    this.loadSubjects();
    this.loadTeachers(); // 👈 нужно
    this.loadGroups(); // 👈 нужно
    this.loadHousings(); // 👈 нужно
  }

  getDayName(day: number): string {
    return this.daysOfWeek[day - 1];
  }

  loadSubjects() {
    this.apiService.get<SubjectDTO[]>('Subject').subscribe((data) => {
      this.subjects = data;
    });
  }

  loadLessons(): void {
    this.apiService.get<LessonDTO[]>('Lesson').subscribe({
      next: (lessonsDto) => {
        console.log(lessonsDto); // Для логирования данных
        const lessonViewModels$ = lessonsDto.map((dto) =>
          this.mapLessonDtoToViewModel(dto)
        );

        forkJoin(lessonViewModels$).subscribe((viewModels) => {
          console.log('Mapped ViewModels: ', viewModels);
          this.lessons = [...viewModels]; // Используй новый массив
          this.applyFilters();
          this.cdRef.detectChanges(); // Запускаем обновление изменений вручную
        });
      },
      error: (err) => {
        console.error('Ошибка при получении данных:', err); // Логирование ошибки
      },
    });
  }

  getLesson(day: string, lessonNumber: number): LessonViewModel | undefined {
    return this.filteredLessons
      .filter((l) => l.DayOfWeek === day && l.LessonNumber === lessonNumber)
      .sort((a, b) => a.LessonNumber - b.LessonNumber)[0];
  }

  getLessonForDay(day: number, lessonNumber: number): LessonViewModel[] {
    // Ищем все уроки для конкретного дня и номера урока, которые могут быть для обеих недель
    const lessonsForDay = this.filteredLessons.filter(
      (lesson) =>
        lesson.DayOfWeek === this.daysOfWeekOriginal[day - 1] &&
        lesson.LessonNumber === lessonNumber &&
        (lesson.WeekType === 'Каждую неделю' ||
          lesson.WeekType === 'Числитель' ||
          lesson.WeekType === 'Знаменатель')
    );

    // Если урок существует для обеих недель, мы отобразим его один раз
    const uniqueLessons = new Map<string, LessonViewModel>();

    // Заполняем Map, чтобы избежать дублирования
    lessonsForDay.forEach((lesson) => {
      const key = `${lesson.LessonId}-${lesson.WeekType}`;
      if (!uniqueLessons.has(key)) {
        uniqueLessons.set(key, lesson);
      }
    });
    // Возвращаем все уникальные уроки для данного дня и урока
    return Array.from(uniqueLessons.values() ? uniqueLessons.values() : []);
  }

  mapLessonDtoToViewModel(dto: LessonDTO): Observable<LessonViewModel> {
    console.log('Mapping DTO: ', dto);
    return this.apiService.getById<TeacherDTO>('Teacher', dto.teacherId).pipe(
      switchMap((teacher) => {
        // Получаем Teacher, затем делаем запрос для PersonalData
        return forkJoin({
          subject: this.apiService.getById<SubjectDTO>(
            'Subject',
            dto.subjectId
          ),
          group: this.apiService.getById<GroupDTO>('Group', dto.groupId),
          teacherData: of(teacher), // Используем уже загруженного Teacher
          personalData: this.apiService.getById<PersonalDataDTO>(
            'PersonalData',
            teacher.personalDataId!
          ),
          housing: this.apiService.getById<HousingDTO>(
            'Housing',
            dto.housingId
          ),
          lessonTime: this.apiService.getById<LessonSlotDTO>(
            'LessonSlot',
            dto.lessonNumberId
          ),
        }).pipe(
          map(
            ({
              subject,
              group,
              teacherData,
              personalData,
              housing,
              lessonTime,
            }) => ({
              LessonId: dto.lessonId!,
              SubjectName: subject.subjectName,
              GroupName: group.groupName,
              TeacherName: `${personalData.lastname} ${personalData.name[0]}. ${
                personalData.patronymic?.[0] ? personalData.patronymic[0] : ''
              }.`,
              DayOfWeek: DayOfWeekEnum[dto.dayOfWeek],
              WeekType: this.getWeekType(dto.weekType),
              LessonNumber: dto.lessonNumberId,
              HousingName: housing.housingName,
              HexademicalColor: subject.hexademicalColor,
              LessonTime: `${lessonTime.lessonStart} - ${lessonTime.lessonEnd}`,
            })
          )
        );
      })
    );
  }

  getWeekType(type?: WeekTypeEnum): string {
    switch (type) {
      case WeekTypeEnum.any:
        return 'Каждую неделю';
      case WeekTypeEnum.odd:
        return 'Числитель';
      case WeekTypeEnum.even:
        return 'Знаменатель';
      default:
        return '';
    }
  }

  applyFilters() {
    if (
      this.filter.groupId === '' &&
      this.filter.subjectId === '' &&
      this.filter.teacherId === ''
    )
      this.filteredLessons = [];
    else {
      this.filteredLessons = this.lessons.filter((lesson) => {
        const isGroupMatch =
          !this.filter.groupId ||
          this.groups.find((g) => g.groupName === lesson.GroupName)?.groupId ===
            Number(this.filter.groupId);
        const isTeacherMatch =
          !this.filter.teacherId ||
          this.teachers.find((t) => lesson.TeacherName.includes(t.lastname))
            ?.userId == Number(this.filter.teacherId);
        const isSubjectMatch =
          !this.filter.subjectId ||
          this.subjects.find((s) => s.subjectName === lesson.SubjectName)
            ?.subjectId === Number(this.filter.subjectId);

        return isGroupMatch && isTeacherMatch && isSubjectMatch;
      });
    }
  }

  weekConflicts(newType: number, existingType: string): boolean {
    if (newType === 0 || existingType === 'Каждую неделю') return true;
    if (newType === 1 && existingType === 'Числитель') return true;
    if (newType === 2 && existingType === 'Знаменатель') return true;
    return false;
  }

  getTeacherNameById(id: number): string {
    const t = this.teachers.find((t) => t.userId === Number(id));
    return t ? `${t.lastname} ${t.name[0]}. ${t.patronymic?.[0]}.` : '';
  }

  getGroupNameById(id: number): string {
    return this.groups.find((g) => g.groupId === Number(id))?.groupName || '';
  }

  getHousingNameById(id: number): string {
    return (
      this.housings.find((h) => h.housingId === Number(id))?.housingName || ''
    );
  }

  addLesson() {
    if (this.selectedDay == null || this.selectedLessonNumber == null) return;
    const payload: LessonDTO = {
      ...(this.newLesson as LessonDTO),
      dayOfWeek: this.selectedDay!,
      lessonNumberId: this.selectedLessonNumber!,
      weekType: Number(this.newLesson.weekType!), // Используем значение из формы
    };
    // 1. Проверка на занятость преподавателя
    // В методе addLesson обновить проверки:
    const currentLessonId = this.newLesson.lessonId;

    // В проверках добавить условие исключения текущего урока
    const isTeacherBusy = this.lessons.some(
      (l) =>
        l.LessonId !== currentLessonId &&
        l.TeacherName === this.getTeacherNameById(payload.teacherId) &&
        l.DayOfWeek === DayOfWeekEnum[payload.dayOfWeek] &&
        +l.LessonNumber === payload.lessonNumberId &&
        this.weekConflicts(payload.weekType, l.WeekType)
      /* остальные условия */
    );

    if (isTeacherBusy) {
      this.addLessonError = 'Преподаватель занят на эту пару.';
      return;
    }

    // 2. Проверка на занятость группы
    const isGroupBusy = this.lessons.some((l) => {
      if (l.LessonId === currentLessonId) return false; // Исключаем текущий урок

      const isSameGroup =
        l.GroupName === this.getGroupNameById(payload.groupId);
      const isSameDay = l.DayOfWeek === DayOfWeekEnum[payload.dayOfWeek];
      const isSameLessonNumber = +l.LessonNumber === payload.lessonNumberId;

      // Проверка на существование пары для этой группы и дня
      if (isSameGroup && isSameDay && isSameLessonNumber) {
        const weekConflict = this.weekConflicts(payload.weekType, l.WeekType);
        if (weekConflict) {
          return true;
        }

        // Если пара уже существует на обе недели, нельзя поставить новую пару
        if (l.WeekType === 'Каждую неделю') {
          this.addLessonError = 'Пара уже существует на обе недели.';
          return true;
        }
      }

      return false;
    });

    if (isGroupBusy) {
      this.addLessonError = 'Группа занята на эту пару.';
      return;
    }

    // 3. Проверка на совпадение корпуса в течение дня
    const dayLessons = this.lessons.filter(
      (l) => l.DayOfWeek === DayOfWeekEnum[payload.dayOfWeek]
    );

    const uniqueHousings = new Set(dayLessons.map((l) => l.HousingName));
    console.log(uniqueHousings);
    console.log(this.getHousingNameById(payload.housingId));
    if (
      uniqueHousings.size > 0 &&
      !uniqueHousings.has(this.getHousingNameById(payload.housingId))
    ) {
      this.addLessonError = 'Все пары в этот день должны быть в одном корпусе.';
      return;
    }
    if (!this.isEditMode) {
      // ✅ УСПЕШНО: отправляем урок
      this.apiService.post<LessonDTO>('Lesson', payload).subscribe({
        next: () => {
          this.closeModal();
          this.loadLessons(); // обновляем расписание
        },
        error: () => {
          this.addLessonError = 'Ошибка при добавлении урока.';
        },
      });
    } else {
      this.updateLesson();
    }
  }

  loadTeachers() {
    this.apiService.get<TeacherDTO[]>('Teacher').subscribe((data) => {
      forkJoin(data.map((dto) => this.buildTeacherViewModel(dto))).subscribe(
        (viewModels) => {
          this.teachers = viewModels;
        }
      );
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

  loadGroups() {
    this.apiService.get<GroupDTO[]>('Group').subscribe((data) => {
      this.groups = data;
      console.log(data);
    });
  }

  loadHousings() {
    this.apiService.get<HousingDTO[]>('Housing').subscribe((data) => {
      this.housings = data;
    });
  }

  openModalForEdit(lesson: LessonViewModel): void {
    this.isEditMode = true;

    // Используем оператор non-null assertion там, где уверены в наличии значения
    this.newLesson = {
      lessonId: lesson.LessonId,
      subjectId:
        this.subjects.find((s) => s.subjectName === lesson.SubjectName)
          ?.subjectId ?? 0,
      groupId:
        this.groups.find((g) => g.groupName === lesson.GroupName)?.groupId ?? 0,
      teacherId:
        this.teachers.find((t) => lesson.TeacherName.includes(t.lastname))
          ?.userId ?? 0,
      housingId:
        this.housings.find((h) => h.housingName === lesson.HousingName)
          ?.housingId ?? 0,
      weekType:
        this.weekTypes.find((wt) => wt.label === lesson.WeekType)?.value ?? 0,
      dayOfWeek: this.daysOfWeekOriginal.indexOf(lesson.DayOfWeek) + 1,
      lessonNumberId: lesson.LessonNumber,
    };

    // Добавим приведение типов и обработку undefined
    this.selectedDay = this.newLesson.dayOfWeek;
    this.selectedLessonNumber = this.newLesson.lessonNumberId;
    this.isLessonModalOpen = true;
  }

  openLessonModal(day: number, lessonNumber: number) {
    // Открываем модалку для добавления нового урока
    this.selectedDay = day;
    this.selectedLessonNumber = lessonNumber;
    this.isLessonModalOpen = true;
  }

  private updateLesson(): void {
    const lessonId = this.newLesson.lessonId!;
    const payload: LessonDTO = {
      lessonId: this.newLesson.lessonId,
      subjectId: Number(this.newLesson.subjectId),
      groupId: Number(this.newLesson.groupId),
      teacherId: Number(this.newLesson.teacherId),
      housingId: Number(this.newLesson.housingId),
      weekType: Number(this.newLesson.weekType),
      dayOfWeek: this.selectedDay!,
      lessonNumberId: this.selectedLessonNumber!,
    };

    console.log(lessonId);

    this.apiService.put<LessonDTO>('Lesson', payload, lessonId).subscribe({
      next: () => {
        this.loadLessons();
        this.closeModal();
      },
      error: (err) => {
        console.error('Ошибка обновления:', err);
        this.addLessonError = 'Ошибка при обновлении урока: ' + err.error;
      },
    });
  }

  // Обновленный метод сохранения
  handleSave(): void {
    if (this.isEditMode) {
      this.updateLesson();
    } else {
      this.addLesson();
    }
  }

  closeModal() {
    this.isLessonModalOpen = false;
    this.selectedDay = 0;
    this.selectedLessonNumber = 0;
    this.newLesson = {
      subjectId: 0,
      groupId: 0,
      teacherId: 0,
      housingId: 0,
      weekType: 0,
    };
    this.addLessonError = '';
  }

  deleteLesson(lessonId: number): void {
    if (confirm('Вы уверены, что хотите удалить этот урок?')) {
      this.apiService.delete('Lesson', lessonId).subscribe({
        next: () => {
          this.lessons = this.lessons.filter((l) => l.LessonId !== lessonId);
          this.applyFilters();
          this.closeModal();
        },
        error: (err) => {
          console.error('Ошибка удаления:', err);
          alert('Не удалось удалить урок');
        },
      });
    }
  }
}
