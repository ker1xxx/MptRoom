import {
  Component,
  Input,
  OnChanges,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { GradeViewModel } from '../../../../../../models/VM/grade.viewmodel';
import { LessonViewModel } from '../../../../../../models/VM/lesson.viewmodel';
import { RecentMarkCardComponent } from '../recent-mark-card/recent-mark-card.component';
import { TimeTableCardComponent } from '../../../../shared/time-table-card/time-table-card.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CloseTaskCardComponent } from '../close-task-card/close-task-card.component';
import { TaskViewModel } from '../../../../../../models/VM/task.viewmodel';
import { LessonSupersedeRequestViewModel } from '../../../../../../models/VM/lesson-supersede-request.viewmodel';
import { SupersedeRequestStatus } from '../../../../../../models/enums/supersede-request-status.enum';
import { SupersedeRequestType } from '../../../../../../models/enums/supersede-type-request.enum';
import { FormsModule } from '@angular/forms';
import { encodeId } from '../../../../../../helper/util';
import { LessonTimePipe } from '../../../../../../helper/LessonTimePipe';

@Component({
  selector: 'student-dashboard-body',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    RecentMarkCardComponent,
    TimeTableCardComponent,
    CloseTaskCardComponent,
    LessonTimePipe,
  ],
  templateUrl: './dashboard-body.component.html',
  styleUrl: './dashboard-body.component.scss',
})
export class DashboardBodyComponent implements OnChanges {
  @Input() schedule: LessonViewModel[] | null = [];
  @Input() grades$!: Observable<GradeViewModel[]>;
  @Input() tasks: TaskViewModel[] | null = [];
  @Input() supersedeRequests: LessonSupersedeRequestViewModel[] | null = [];

  combinedData$!: Observable<{
    original: LessonViewModel[];
    supersedes: LessonViewModel[];
  }>;

  time_table$!: Observable<LessonViewModel[]>;
  dayName: string = '';
  today: string = '';

  SupersedeRequestType = SupersedeRequestType;

  readonly LESSON_SLOTS = [1, 2, 3, 4, 5];
  lessonSlotRows: {
    slot: number;
    original: LessonViewModel | undefined;
    supersede: LessonViewModel | undefined;
  }[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (this.hasChanges(changes)) {
      this.processCombinedData();
    }
  }

  private processCombinedData(): void {
    const processed = this.processScheduleWithSupersedes();
    this.lessonSlotRows = this.LESSON_SLOTS.map((slot) => ({
      slot,
      original: processed.original.find((l) => l.LessonNumber === slot),
      supersede: processed.supersedes.find((l) => l.LessonNumber === slot),
    }));
  }

  hasNoLessons(rows: { original?: any; supersede?: any }[]): boolean {
    return rows.every((row) => !row.original && !row.supersede);
  }
  private hasChanges(changes: SimpleChanges): boolean {
    return !!changes['schedule'] || !!changes['supersedeRequests'];
  }

  constructor(private router: Router) {
    this.initDateStrings();
  }

  private initDateStrings(): void {
    const daysOfWeek = [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среда',
      'Четверг',
      'Пятница',
      'Суббота',
    ];
    const monthsOfYear = [
      'Января',
      'Февраля',
      'Марта',
      'Апреля',
      'Мая',
      'Июня',
      'Июля',
      'Августа',
      'Сентября',
      'Октября',
      'Ноября',
      'Декабря',
    ];

    const today = new Date();
    this.dayName = daysOfWeek[today.getDay()];
    this.today = `${today.getDate()} ${monthsOfYear[today.getMonth()]}`;
  }

  private processScheduleWithSupersedes(): {
    original: LessonViewModel[];
    supersedes: LessonViewModel[];
  } {
    const today = new Date().toISOString().split('T')[0];
    const originalLessons = [...this.schedule!];
    const supersedeLessons: LessonViewModel[] = [];

    this.supersedeRequests!.forEach((request) => {
      if (request.dateToSupersede !== today) return;

      const newLesson = this.createLessonFromSupersede(request);
      supersedeLessons.push(newLesson);

      // Обработка замены: удаляем оригинальный урок
      if (request.supersedeRequestType === SupersedeRequestType.replaced) {
        const index = originalLessons.findIndex(
          (l) => l.LessonId === request.affectedLessonId
        );
        if (index !== -1) originalLessons.splice(index, 1);
      }

      // Обработка переноса/отмены: модифицируем оригинал
      if (
        request.supersedeRequestType === SupersedeRequestType.moved ||
        request.supersedeRequestType === SupersedeRequestType.canceled
      ) {
        const originalLesson = originalLessons.find(
          (l) => l.LessonId === request.affectedLessonId
        );
        if (originalLesson) {
          originalLesson.isModified = true;
          originalLesson.modificationType = request.supersedeRequestType;
          originalLesson.LessonTime = request.lessonSlotName; // Для moved
        }
      }
    });

    return {
      original: this.filterAndSort(originalLessons),
      supersedes: this.filterAndSort(supersedeLessons),
    };
  }

  navigateToTask(obj: any) {
    const courseHash = encodeId(obj!.courseId!);
    const postHash = encodeId(obj.postId);

    this.router.navigate(['student', 'course', courseHash, postHash]);
  }

  private filterAndSort(lessons: LessonViewModel[]): LessonViewModel[] {
    const dayMapping: { [key: string]: number } = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return lessons
      .filter((lesson) => dayMapping[lesson.DayOfWeek] === new Date().getDay())
      .sort((a, b) => a.LessonNumber - b.LessonNumber);
  }

  getModificationClass(
    modificationType: SupersedeRequestType | undefined
  ): string {
    if (!modificationType) return '';

    // Получаем строковое представление Enum
    const typeString = SupersedeRequestType[modificationType];

    // Приводим к нижнему регистру для соответствия CSS-классам
    return typeString.toLowerCase();
  }

  private createLessonFromSupersede(
    request: LessonSupersedeRequestViewModel
  ): LessonViewModel {
    // Определяем тип модификации
    let modificationType = request.supersedeRequestType;
    if (modificationType === SupersedeRequestType.replaced) {
      modificationType = SupersedeRequestType.added;
    }

    return {
      LessonId: Math.random(), // Используем ID запроса
      SubjectId: request.subjectId,
      SubjectName: request.subjectName,
      GroupId: request.groupId,
      GroupName: request.groupName,
      TeacherId: request.teacherId,
      TeacherName: request.teacherName,
      DayOfWeek: this.getEnglishDayOfWeek(new Date(request.dateToSupersede)),
      LessonNumber: request.lessonSlotId,
      HexademicalColor: request.hexademicalColor || '#CCCCCC',
      LessonTime: request.lessonSlotName,
      isModified: true,
      modificationType: modificationType,
      WeekType: '',
      HousingName: '',
      newLessonSlot: '',
      originalLessonSlot: '',
    };
  }

  getStatusText(lesson?: LessonViewModel): string {
    if (!lesson) return '';

    switch (lesson.modificationType) {
      case SupersedeRequestType.added:
        return 'Добавлено';

      case SupersedeRequestType.replaced:
        return 'Заменено';

      case SupersedeRequestType.moved:
        if (!lesson.LessonTime) return 'Некорректные данные о времени';

        const [startLessonTime, endLessonTime] = lesson.LessonTime.split('-');

        const formattedStart = startLessonTime.trim().slice(0, 5); // формат HH:mm
        const formattedEnd = endLessonTime.trim().slice(0, 5);

        return `Перенесено на ${formattedStart} - ${formattedEnd}`;

      case SupersedeRequestType.canceled:
        return 'Отменено (с отработкой)';

      default:
        return '';
    }
  }

  private getEnglishDayOfWeek(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // TrackBy функции остаются без изменений
  trackByGradeId = (index: number, grade: GradeViewModel) =>
    `${grade.Subject}-${grade.Task}`;
  trackByLessonSubject = (index: number, lesson: LessonViewModel) =>
    lesson.SubjectName;
  trackByTaskId = (index: number, task: TaskViewModel) =>
    `${task.subjectName}-${task.dueTime}`;
}
