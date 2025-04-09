import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { ApiService } from '../../../../services/api.service';
import { LoaderService } from '../../../../services/loader.service';
import { BehaviorSubject, map } from 'rxjs';
import { LessonViewModel } from '../../../../models/VM/lesson.viewmodel';
import { TimeTableBodyComponent } from './components/time-table-body/time-table-body.component';

@Component({
  selector: 'app-time-table',
  imports: [HeaderComponent, CommonModule, TimeTableBodyComponent],
  templateUrl: './time-table.component.html',
  styleUrl: './time-table.component.scss',
})
export class TimeTableComponent {
  user$!: StudentDTO;
  schedule$ = new BehaviorSubject<LessonViewModel[] | null>(null);
  constructor(
    private apiService: ApiService,
    private loaderService: LoaderService
  ) {}

  async ngOnInit() {
    await this.loadSchedule();
  }

  private loadSchedule() {
    this.loaderService.loadWithCache(this.schedule$, () =>
      this.apiService
        .getSchedule()
        .pipe(map((lessons) => this.processAndSortLessons(lessons)))
    );
    console.log('schedule: ', this.schedule$);
  }

  private processAndSortLessons(lessons: LessonViewModel[]): LessonViewModel[] {
    const currentWeekType = this.getCurrentWeekType();
    console.log('lessons', lessons);
    return lessons
      .filter(
        (lesson) =>
          lesson.WeekType === 'any' || lesson.WeekType === currentWeekType
      )
      .sort((a, b) => {
        // Сортировка по дням недели
        const dayComparison =
          this.daysOrder.indexOf(a.DayOfWeek) -
          this.daysOrder.indexOf(b.DayOfWeek);

        // Если дни одинаковые - сортировка по номеру урока
        return dayComparison !== 0
          ? dayComparison
          : a.LessonNumber - b.LessonNumber;
      });
  }

  // Предполагаемая структура (добавьте в код):
  private daysOrder = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  private getCurrentWeekType(): string {
    // Реализация определения текущей недели
    const weekNumber = this.getWeekNumber(new Date());
    return weekNumber % 2 === 0 ? 'even' : 'odd';
  }

  private getWeekNumber(d: Date): number {
    // Реализация расчета номера недели
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );
  }
}
