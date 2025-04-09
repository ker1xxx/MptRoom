import { Component, Input } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { LessonViewModel } from '../../../../../../models/VM/lesson.viewmodel';
import { DailyLessons } from '../../../../../../models/helpers/daily-lesson.model';
import { CommonModule } from '@angular/common';
import { TimeTableCardComponent } from '../../../../shared/time-table-card/time-table-card.component';

@Component({
  selector: 'student-time-table-body',
  imports: [CommonModule, TimeTableCardComponent],
  templateUrl: './time-table-body.component.html',
  styleUrl: './time-table-body.component.scss',
})
export class TimeTableBodyComponent {
  @Input() time_table$ = new BehaviorSubject<LessonViewModel[] | null>(null);

  ngOnInit() {
    console.log('timtable:', this.time_table$);
  }
  // 1. Исправляем порядок дней на английские названия
  readonly daysOrder = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  groupedLessons$ = this.time_table$.pipe(
    map((lessons) => this.groupLessonsByDay(lessons ?? []))
  );

  // 2. Добавляем перевод дней недели для отображения
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

  // 3. Исправляем фильтрацию по типам недель
  private groupLessonsByDay(lessons: LessonViewModel[]): DailyLessons {
    const currentWeekType = this.getCurrentWeekType();

    return this.daysOrder.map((englishDay) => {
      const dayLessons = lessons
        .filter(
          (lesson) =>
            lesson.DayOfWeek === englishDay &&
            (lesson.WeekType === 'any' || lesson.WeekType === currentWeekType)
        )
        .sort((a, b) => a.LessonNumber - b.LessonNumber);

      return {
        day: this.translateDay(englishDay),
        lessons: dayLessons,
      };
    });
  }

  // 4. Приводим типы недель в соответствие с бэкендом
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

  // Остальные методы остаются без изменений
  hasNoLessons(days: DailyLessons): boolean {
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
