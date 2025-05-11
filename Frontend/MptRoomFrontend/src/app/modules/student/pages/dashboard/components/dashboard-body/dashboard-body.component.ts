import { Component, Input, OnChanges } from '@angular/core';
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

@Component({
  selector: 'student-dashboard-body',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    RecentMarkCardComponent,
    TimeTableCardComponent,
    CloseTaskCardComponent,
  ],
  templateUrl: './dashboard-body.component.html',
  styleUrl: './dashboard-body.component.scss',
})
export class DashboardBodyComponent implements OnChanges {
  @Input() schedule$ = new BehaviorSubject<LessonViewModel[] | null>(null);
  @Input() grades$!: Observable<GradeViewModel[]>;
  @Input() tasks$!: Observable<TaskViewModel[]>;
  @Input() supersedeRequests$!: BehaviorSubject<
    LessonSupersedeRequestViewModel[]
  >;
  combinedData$!: Observable<{
    original: LessonViewModel[];
    supersedes: LessonViewModel[];
  }>;

  time_table$!: Observable<LessonViewModel[]>;
  dayName: string = '';
  today: string = '';

  SupersedeRequestType = SupersedeRequestType;

  readonly LESSON_SLOTS = [1, 2, 3, 4, 5];
  lessonSlotRows$!: Observable<
    {
      slot: number;
      original: LessonViewModel | undefined;
      supersede: LessonViewModel | undefined;
    }[]
  >;

  ngOnChanges(): void {
    if (this.schedule$) {
      this.combinedData$ = this.schedule$.pipe(
        map((schedule) => this.processScheduleWithSupersedes(schedule || []))
      );
      this.lessonSlotRows$ = this.combinedData$.pipe(
        map((data) => {
          return this.LESSON_SLOTS.map((slot) => {
            const original = data.original.find((l) => l.LessonNumber === slot);
            const supersede = data.supersedes.find(
              (l) => l.LessonNumber === slot
            );
            return { slot, original, supersede };
          });
        })
      );
    }
  }

  hasNoLessons(rows: { original?: any; supersede?: any }[]): boolean {
    return rows.every((row) => !row.original && !row.supersede);
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

    const today = new Date(2025, 4, 12);
    this.dayName = daysOfWeek[today.getDay()];
    this.today = `${today.getDate()} ${monthsOfYear[today.getMonth()]}`;
  }

  private processScheduleWithSupersedes(lessons: LessonViewModel[]): {
    original: LessonViewModel[];
    supersedes: LessonViewModel[];
  } {
    if (!this.supersedeRequests$?.value)
      return { original: lessons, supersedes: [] };

    const today = new Date().toISOString().split('T')[0];
    const supersedes = this.supersedeRequests$.value;

    const originalLessons = lessons.map((lesson) => ({ ...lesson }));
    const supersedeLessons: LessonViewModel[] = [];
    console.log('supersedes', supersedes);
    supersedes.forEach((supersede) => {
      if (supersede.dateToSupersede !== today) return;

      // Автоматическое определение типа для добавленных пар
      if (supersede.supersedeRequestType === SupersedeRequestType.added) {
        const existingLesson = originalLessons.find(
          (l) => l.LessonNumber === supersede.lessonSlotId
        );

        const newLesson = this.createLessonFromSupersede(supersede);
        newLesson.modificationType = existingLesson
          ? SupersedeRequestType.replaced
          : SupersedeRequestType.added;
        newLesson.LessonTime = supersede.lessonSlotName;
        supersedeLessons.push(newLesson);
      }

      // Обработка других типов изменений
      const originalLesson = originalLessons.find(
        (l) => l.LessonId === supersede.affectedLessonId
      );

      console.log('original lessons', originalLesson);
      console.log('supersede', supersede);

      if (originalLesson) {
        originalLesson.isModified = true;
        originalLesson.modificationType =
          supersede.supersedeRequestType === SupersedeRequestType.added
            ? SupersedeRequestType.replaced
            : supersede.supersedeRequestType;

        // Исправляем источник времени
        originalLesson.newLessonSlot = supersede.lessonSlotName;
        originalLesson.LessonTime = supersede.lessonSlotName; // Обновляем основное время
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
    console;
    return lessons
      .filter(
        (lesson) =>
          dayMapping[lesson.DayOfWeek] === new Date(2025, 4, 12, 7).getDay()
      )
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
    supersede: LessonSupersedeRequestViewModel
  ): LessonViewModel {
    return {
      LessonId: -Math.random(),
      SubjectId: supersede.subjectId,
      SubjectName: supersede.subjectName,
      GroupId: supersede.groupId,
      GroupName: supersede.groupName,
      TeacherId: supersede.teacherId,
      TeacherName: supersede.teacherName,
      DayOfWeek: this.getEnglishDayOfWeek(new Date(2025, 4, 12, 7)),
      WeekType: '',
      LessonNumber: supersede.lessonSlotId,
      HousingName: '',
      HexademicalColor: supersede.hexademicalColor || '#CCCCCC',
      LessonTime: supersede.lessonSlotName,
      isModified: true,
      modificationType: SupersedeRequestType.added,
      newLessonSlot: supersede.lessonSlotName,
      originalLessonSlot: '',
    };
  }

  getStatusText(lesson: LessonViewModel): string {
    switch (lesson.modificationType) {
      case SupersedeRequestType.added:
        return 'Добавлено';
      case SupersedeRequestType.replaced:
        return 'Заменено';
      case SupersedeRequestType.moved:
        return `Перенесено`;
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
