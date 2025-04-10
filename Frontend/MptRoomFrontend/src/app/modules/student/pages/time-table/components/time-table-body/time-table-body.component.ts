// time-table-body.component.ts
import { Component, Input, OnDestroy } from '@angular/core';
import { BehaviorSubject, map, Subject, takeUntil } from 'rxjs';
import { LessonViewModel } from '../../../../../../models/VM/lesson.viewmodel';
import { CommonModule } from '@angular/common';
import { TimeTableCardComponent } from '../../../../shared/time-table-card/time-table-card.component';
import { DailyLesson } from '../../../../../../models/helpers/daily-lesson.model';

@Component({
  selector: 'student-time-table-body',
  imports: [CommonModule, TimeTableCardComponent],
  templateUrl: './time-table-body.component.html',
  styleUrl: './time-table-body.component.scss',
})
export class TimeTableBodyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  week_type_class = '';

  @Input() set time_table(value: LessonViewModel[] | null) {
    if (value) {
      this.time_table$.next(value);
    }
  }
  get isEvenWeek(): boolean {
    return this.getCurrentWeekType() === 'even';
  }
  // 1. Используем начальное значение пустого массива
  time_table$ = new BehaviorSubject<LessonViewModel[]>([]);

  ngOnInit() {
    const weekType = this.getCurrentWeekType();
    this.week_type_class = weekType + '-week';
    console.log(this.week_type_class);
  }
  // 2. Добавляем состояния загрузки
  isLoading = true;
  error: string | null = null;

  readonly daysOrder = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  getCurrentWeekTypeDisplay(): string {
    return this.isEvenWeek ? 'Знаменатель' : 'Числитель';
  }

  // 3. Преобразование данных с обработкой ошибок
  groupedLessons$ = this.time_table$.pipe(
    map((lessons) => {
      try {
        return this.groupLessonsByDay(lessons);
      } catch (error) {
        console.error('Error grouping lessons:', error);
        this.error = 'Ошибка формирования расписания';
        return [];
      }
    })
  );

  constructor() {
    // 4. Отслеживаем загрузку данных
    this.time_table$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.error = null;
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Ошибка загрузки расписания';
        console.error(err);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  joinHousings(housings: string[]): string {
    return housings.filter((h) => h).join(', ');
  }

  private groupLessonsByDay(lessons: LessonViewModel[]): DailyLesson[] {
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
        housings: housings, // Название свойства должно совпадать с интерфейсом
      };
    });
  }

  private translateDay(day: string): string {
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

  private getCurrentWeekType(): string {
    const weekNumber = this.getISOWeekNumber(new Date());
    return weekNumber % 2 === 0 ? 'even' : 'odd';
  }

  private getISOWeekNumber(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  hasNoLessons(days: DailyLesson[]): boolean {
    return days.every((day) => day.lessons.length === 0);
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
}
