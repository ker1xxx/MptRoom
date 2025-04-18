import { Component, Input, OnChanges } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { GradeViewModel } from '../../../../../../models/VM/grade.viewmodel';
import { LessonViewModel } from '../../../../../../models/VM/lesson.viewmodel';
import { RecentMarkCardComponent } from '../recent-mark-card/recent-mark-card.component';
import { TimeTableCardComponent } from '../../../../shared/time-table-card/time-table-card.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CloseTaskCardComponent } from '../close-task-card/close-task-card.component';
import { TaskViewModel } from '../../../../../../models/VM/task.viewmodel';

@Component({
  selector: 'student-dashboard-body',
  imports: [
    CommonModule,
    RouterModule,
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

  time_table$!: Observable<LessonViewModel[]>;
  dayName: string = '';
  today: string = '';

  ngOnChanges(): void {
    if (this.tasks$) {
      this.tasks$ = this.tasks$.pipe(
        tap((tasks) => console.log('Tasks in component:', tasks))
      );
    }

    if (this.schedule$) {
      this.time_table$ = this.schedule$.pipe(
        map((schedule) => {
          if (!schedule) return [];
          //Поменять индекс потом
          const todayIndex = new Date().getDay();
          const dayMapping: { [key: string]: number } = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
          };

          return schedule
            .filter(
              (lesson) => dayMapping[lesson.DayOfWeek] === new Date().getDay()
            )
            .sort((a, b) => a.LessonNumber - b.LessonNumber);
        })
      );
    }
  }

  constructor() {
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

  trackByGradeId(index: number, grade: GradeViewModel): string {
    return `${grade.Subject}-${grade.Task}`;
  }

  trackByLessonSubject(index: number, lesson: LessonViewModel): string {
    return lesson.SubjectName;
  }

  trackByTaskId(index: number, task: TaskViewModel): string {
    return `${task.subjectName}-${task.dueTime}`;
  }
}
