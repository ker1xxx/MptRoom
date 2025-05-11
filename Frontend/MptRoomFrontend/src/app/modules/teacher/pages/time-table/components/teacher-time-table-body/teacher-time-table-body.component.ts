import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import {
  Subject,
  BehaviorSubject,
  map,
  takeUntil,
  Observable,
  forkJoin,
  of,
  switchMap,
} from 'rxjs';
import { DailyLesson } from '../../../../../../models/helpers/daily-lesson.model';
import { LessonViewModel } from '../../../../../../models/VM/lesson.viewmodel';
import { SupersedeRequestStatus } from '../../../../../../models/enums/supersede-request-status.enum';
import { LessonSupersedeRequestViewModel } from '../../../../../../models/VM/lesson-supersede-request.viewmodel';
import { CommonModule } from '@angular/common';
import { TeacherTimeTableCardComponent } from '../../../../shared/time-table-card/time-table-card.component';
import { LessonSupersedeRequestDTO } from '../../../../../../models/DTO/lesson-supersede-request.dto';
import { GroupDTO } from '../../../../../../models/DTO/group.dto';
import { LessonSlotDTO } from '../../../../../../models/DTO/lesson-slot.dto';
import { SubjectDTO } from '../../../../../../models/DTO/subject.dto';
import { ApiService } from '../../../../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { RussianDatePipe } from '../../../../../../helper/RussianDatePipe';
import flatpickr from 'flatpickr';
import { Russian } from 'flatpickr/dist/l10n/ru.js';
import { NotificationService } from '../../../../../../services/notification.service';
import { SupersedeRequestType } from '../../../../../../models/enums/supersede-type-request.enum';
import { LessonDTO } from '../../../../../../models/DTO/lesson.dto';
import { HousingDTO } from '../../../../../../models/DTO/housing.dto';
import { PersonalDataDTO } from '../../../../../../models/DTO/personal-data.dto';
import { TeacherDTO } from '../../../../../../models/DTO/teacher.dto';
import { DayOfWeekEnum } from '../../../../../../models/enums/day-of-week.enum';
import { WeekTypeEnum } from '../../../../../../models/enums/week-type.enum';
import { LessonTimePipe } from '../../../../../../helper/LessonTimePipe';

@Component({
  selector: 'teacher-time-table-body',
  imports: [
    CommonModule,
    TeacherTimeTableCardComponent,
    FormsModule,
    RussianDatePipe,
    LessonTimePipe,
  ],
  templateUrl: './teacher-time-table-body.component.html',
  styleUrl: './teacher-time-table-body.component.scss',
})
export class TeacherTimeTableBodyComponent {
  private destroy$ = new Subject<void>();
  week_type_class = '';
  isLoading = true;
  error: string | null = null;

  selectedGroupId: number | null = null;
  selectedSubjectId: number | null = null;
  selectedLessonId: number | null = null;
  lessons: LessonViewModel[] = [];
  availableLessons: LessonViewModel[] = [];
  filteredDates: string[] = [];

  isModalOpen: boolean = false;
  newSubstitute: LessonSupersedeRequestDTO = {
    teacherId: 1, // Заполните данными
    groupId: 0,
    dateToSupersede: '',
    lessonSlotId: 0,
    subjectId: 0,
    requestTime: new Date().toISOString(),
    supersedeRequestStatus: SupersedeRequestStatus.sent, // Значение по умолчанию
    supersedeRequestType: SupersedeRequestType.added,
  };
  @Input() TeacherId!: number;

  SupersedeRequestType = SupersedeRequestType;

  groups: GroupDTO[] = [];
  lessonSlots: LessonSlotDTO[] = [];
  subjects: SubjectDTO[] = [];

  @Input() set time_table(value: LessonViewModel[] | null) {
    if (value) {
      this.time_table$.next(value);
    }
  }

  time_table$ = new BehaviorSubject<LessonViewModel[]>([]);
  lessonSupersedeRequests: LessonSupersedeRequestViewModel[] = [];

  SupersedeRequestStatus = SupersedeRequestStatus;

  selectedLesson: LessonViewModel | null = null;
  availableDates: Date[] = [];

  groupedLessons$ = this.time_table$.pipe(
    map((lessons) => {
      return this.groupLessonsByDay(lessons);
    })
  );
  get isEvenWeek(): boolean {
    return this.getCurrentWeekType() === 'even';
  }

  // Сюда добавим логику для загрузки замен
  @Input() set lessonSupersedeRequestsInput(
    value: LessonSupersedeRequestViewModel[] | null
  ) {
    if (value) {
      this.lessonSupersedeRequests = this.filterValidSupersedeRequests(value);
    } else {
      this.lessonSupersedeRequests = [];
    }
  }

  readonly daysOrder = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  @ViewChild('dateToSupersede', { static: false }) dateToSupersede!: ElementRef;
  dueDate: string = '';
  private flatpickrInstance: any;

  constructor(
    private api: ApiService,
    private notificationService: NotificationService
  ) {}

  getCurrentWeekTypeDisplay(): string {
    return this.isEvenWeek ? 'Знаменатель' : 'Числитель';
  }

  ngOnInit() {
    const weekType = this.getCurrentWeekType();
    this.week_type_class = weekType + '-week';
    this.getGroups().subscribe((groups) => (this.groups = groups));
    this.getLessonSlots().subscribe((slots) => (this.lessonSlots = slots));
    this.getSubjects().subscribe((subjects) => (this.subjects = subjects));
    this.getLessons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRequestTypeChange() {
    this.resetDependentFields();

    // Если тип — не 'added', нужна старая пара
    if (
      this.newSubstitute.supersedeRequestType === SupersedeRequestType.moved ||
      this.newSubstitute.supersedeRequestType === SupersedeRequestType.canceled
    ) {
      this.loadAvailableData(); // подгрузка доступных уроков
    }

    this.onGroupOrSubjectChange(); // фильтруем данные
  }

  private loadAvailableData() {
    if (this.selectedGroupId && this.selectedSubjectId) {
      this.loadLessonsForGroupAndSubject();
    }
  }

  onGroupOrSubjectChange() {
    if (this.newSubstitute.groupId && this.newSubstitute.subjectId) {
      this.loadLessonsForGroupAndSubject();
    } else {
      this.availableLessons = [];
      this.filteredDates = [];
    }
  }

  private loadLessonsForGroupAndSubject() {
    // Фильтруем уроки из текущего расписания
    this.availableLessons = this.time_table$.value.filter(
      (lesson) =>
        Number(lesson.GroupId) === Number(this.newSubstitute.groupId) &&
        Number(lesson.SubjectId) === Number(this.newSubstitute.subjectId)
    );

    this.generateAvailableDates();
  }

  generateAvailableDates() {
    const type = this.newSubstitute.supersedeRequestType;

    if (type === SupersedeRequestType.added) {
      this.availableDates = this.generateDatesExceptSunday();
    } else if (type === SupersedeRequestType.moved && this.selectedLesson) {
      this.availableDates = this.generateDatesForDay(
        this.selectedLesson.DayOfWeek
      );
    } else {
      this.availableDates = this.getUniqueDates(this.availableLessons);
    }
    this.initDatePicker();
  }

  private initDatePicker() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }

    const formattedDates = this.availableDates.map((d) => this.formatDate(d));
    setTimeout(() => {
      this.flatpickrInstance = flatpickr(this.dateToSupersede.nativeElement, {
        minDate: 'today',
        enable: formattedDates,
        dateFormat: 'Y-m-d',
        locale: Russian,
        defaultDate: this.newSubstitute.dateToSupersede,
      });
    }, 500);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  resetDependentFields() {
    this.selectedLesson = null; // Добавляем сброс выбранного урока
    this.selectedLessonId = null;
    this.newSubstitute.lessonSlotId = 0;
    this.newSubstitute.dateToSupersede = '';
    this.availableLessons = [];
    this.availableDates = [];
  }

  generateDatesExceptSunday(): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Генерируем даты на 4 недели вперед
    for (let i = 0; i < 28; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      if (date.getDay() !== 1) dates.push(new Date(date.setHours(0, 0, 0, 0)));
    }

    // Удаляем дубликаты и сортируем
    return [...new Set(dates.map((d) => d.getTime()))]
      .map((t) => new Date(t))
      .sort((a, b) => a.getTime() - b.getTime());
  }

  private generateDatesForDay(dayOfWeek: string): Date[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates: Date[] = [];

    const dayIndex = [
      'Saturday',
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
    ].indexOf(dayOfWeek);

    for (let i = 0; i < 28; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      if (date.getDay() === dayIndex) {
        dates.push(new Date(date.setHours(0, 0, 0, 0)));
      }
    }

    return dates;
  }

  private getUniqueDates(lessons: LessonViewModel[]): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    lessons.forEach((lesson) => {
      const dayIndex = [
        'Saturday',
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
      ].indexOf(lesson.DayOfWeek);

      // Генерируем даты на 4 недели вперед
      for (let i = 0; i < 28; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        // Проверяем совпадение дня недели
        if (date.getDay() !== dayIndex) continue;

        // Проверяем тип недели
        const weekType = this.getISOWeekNumber(date) % 2 === 0 ? 'even' : 'odd';
        const isWeekMatch =
          lesson.WeekType === 'any' ||
          lesson.WeekType.toLowerCase() === weekType;

        if (isWeekMatch && date >= today) {
          dates.push(new Date(date.setHours(0, 0, 0, 0)));
        }
      }
    });

    // Удаляем дубликаты и сортируем
    return [...new Set(dates.map((d) => d.getTime()))]
      .map((t) => new Date(t))
      .sort((a, b) => a.getTime() - b.getTime());
  }

  private getCurrentWeekType(): string {
    const weekNumber = this.getISOWeekNumber(new Date());
    return weekNumber % 2 === 0 ? 'even' : 'odd';
  }

  getTypeName(type: SupersedeRequestType): string {
    switch (type) {
      case SupersedeRequestType.added:
        return 'Добавить пару';
      case SupersedeRequestType.moved:
        return 'Перенести пару';
      case SupersedeRequestType.canceled:
        return 'Отменить пару';
      default:
        return 'Неизвестный тип';
    }
  }

  private getISOWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  getGroups(): Observable<GroupDTO[]> {
    return this.api.get<GroupDTO[]>(`Group/teacher/${this.TeacherId}`);
  }

  getLessonSlots(): Observable<LessonSlotDTO[]> {
    return this.api.get<LessonSlotDTO[]>('LessonSlot');
  }

  getSubjects(): Observable<SubjectDTO[]> {
    return this.api.get<SubjectDTO[]>(`Subject/teacher/${this.TeacherId}`);
  }

  getLessons(): void {
    this.api.get<LessonDTO[]>(`Lesson/teacher/${this.TeacherId}`).subscribe({
      next: (lessonsDto) => {
        const lessonViewModels$ = lessonsDto.map((dto) =>
          this.mapLessonDtoToViewModel(dto)
        );

        forkJoin(lessonViewModels$).subscribe((viewModels) => {
          this.availableLessons = [...viewModels]; // Используй новый массив
        });
      },
      error: (err) => {
        console.error(err);
        this.notificationService.show('❌ Ошибка при загрузке пар', 'error');
      },
    });
  }

  mapLessonDtoToViewModel(dto: LessonDTO): Observable<LessonViewModel> {
    return this.api.getById<TeacherDTO>('Teacher', dto.teacherId).pipe(
      switchMap((teacher) => {
        // Получаем Teacher, затем делаем запрос для PersonalData
        return forkJoin({
          subject: this.api.getById<SubjectDTO>('Subject', dto.subjectId),
          group: this.api.getById<GroupDTO>('Group', dto.groupId),
          teacherData: of(teacher), // Используем уже загруженного Teacher
          personalData: this.api.getById<PersonalDataDTO>(
            'PersonalData',
            teacher.personalDataId!
          ),
          housing: this.api.getById<HousingDTO>('Housing', dto.housingId),
          lessonTime: this.api.getById<LessonSlotDTO>(
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
              SubjectId: subject.subjectId!,
              SubjectName: subject.subjectName,
              GroupId: group.groupId!,
              GroupName: group.groupName,
              TeacherId: teacherData.userId!,
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
        return 'any';
      case WeekTypeEnum.odd:
        return 'odd';
      case WeekTypeEnum.even:
        return 'even';
      default:
        return '';
    }
  }

  // Фильтруем замены, которые не раньше текущего дня
  private filterValidSupersedeRequests(
    requests: LessonSupersedeRequestViewModel[]
  ): LessonSupersedeRequestViewModel[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Сбрасываем время

    return requests
      .filter((request) => {
        const requestDate = new Date(request.dateToSupersede);
        requestDate.setHours(0, 0, 0, 0);
        return requestDate >= today;
      })
      .filter((request) => request.dateToSupersede);
  }

  supersedeRequestToText(status: SupersedeRequestStatus): string {
    switch (status) {
      case SupersedeRequestStatus.sent:
        return 'Запрос отправлен';
      case SupersedeRequestStatus.approved:
        return 'Замена утверждена';
      case SupersedeRequestStatus.declined:
        return 'Запрос отклонен';
    }
  }

  groupLessonsByDay(lessons: LessonViewModel[]): DailyLesson[] {
    const currentWeekType = this.getCurrentWeekType();
    return this.daysOrder.map((englishDay) => {
      const dayLessons = lessons
        .filter(
          (lesson) =>
            lesson.DayOfWeek === englishDay &&
            (lesson.WeekType.toLowerCase() === 'any' ||
              lesson.WeekType.toLowerCase() === currentWeekType)
        )
        .sort((a, b) => a.LessonNumber - b.LessonNumber);

      const housings = [...new Set(dayLessons.map((l) => l.HousingName))];

      return {
        day: this.translateDay(englishDay),
        lessons: dayLessons,
        housings: housings,
      };
    });
  }

  translateDay(day: string): string {
    const daysMap: { [key: string]: string } = {
      Monday: 'Понедельник',
      Tuesday: 'Вторник',
      Wednesday: 'Среда',
      Thursday: 'Четверг',
      Friday: 'Пятница',
      Saturday: 'Суббота',
    };
    return daysMap[day] || day;
  }

  joinHousings(housings: string[]): string {
    return housings.filter((h) => h).join(', ');
  }

  trackByDay(
    index: number,
    item: { day: string; lessons: LessonViewModel[] }
  ): string {
    return item.day;
  }

  trackByLesson(index: number, lesson: LessonViewModel): number {
    return lesson.LessonId;
  }

  openModal() {
    this.isModalOpen = true;
    this.resetDependentFields();

    setTimeout(() => {
      this.initDatePicker();
    });
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetForm();

    // Уничтожаем flatpickr
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
      this.flatpickrInstance = null;
    }
  }

  resetForm() {
    this.newSubstitute = {
      teacherId: 1, // Заполните данными
      groupId: 0,
      dateToSupersede: '',
      lessonSlotId: 0,
      subjectId: 0,
      requestTime: new Date().toISOString(),
      supersedeRequestStatus: SupersedeRequestStatus.sent,
      supersedeRequestType: SupersedeRequestType.added,
    };
  }

  submitSubstituteRequest() {
    if (!this.newSubstitute.groupId || !this.newSubstitute.subjectId) {
      this.notificationService.show('❌ Выберите группу и предмет', 'error');
      return;
    }
    const dtoToSend: LessonSupersedeRequestDTO = {
      teacherId: this.TeacherId,
      groupId: this.newSubstitute.groupId,
      subjectId: this.newSubstitute.subjectId,
      dateToSupersede: this.newSubstitute.dateToSupersede,
      lessonSlotId: Number(this.newSubstitute.lessonSlotId),
      supersedeRequestType: this.newSubstitute.supersedeRequestType,
      affectedLessonId: this.selectedLesson?.LessonId,
      requestTime: new Date().toISOString(),
      supersedeRequestStatus: SupersedeRequestStatus.sent,
    };

    this.api
      .post<LessonSupersedeRequestDTO>('LessonSupersedeRequest', dtoToSend)
      .subscribe({
        next: () => {
          this.notificationService.show('✅ Заявка сохранена', 'success');
          this.closeModal();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        error: (err) => {
          console.error(err);
          this.notificationService.show('❌ Ошибка сохранения', 'error');
        },
      });
  }
}
