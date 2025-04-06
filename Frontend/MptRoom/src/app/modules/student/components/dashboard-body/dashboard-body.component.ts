import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentMarkCardComponent } from '../recent-mark-card/recent-mark-card.component';
import { Observable, map } from 'rxjs';
import { TimeTableCardComponent } from '../time-table-card/time-table-card.component';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import { LessonViewModel } from '../../../../models/VM/lesson.viewmodel';
import { GradeViewModel } from '../../../../models/VM/grade.viewmodel';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'student-dashboard-body',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RecentMarkCardComponent,
    TimeTableCardComponent,
  ],
  templateUrl: './dashboard-body.component.html',
  styleUrl: './dashboard-body.component.scss',
})
export class DashboardBodyComponent {
  @Input() schedule$!: Observable<LessonViewModel[]>; // Теперь ожидаем список уроков
  @Input() grades$!: Observable<GradeViewModel[]>; // Исправлен тип, так как должен быть массив

  time_table$!: Observable<LessonViewModel[]>; // Уроки на текущий день
  dayName: string = '';
  today: string = '';

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

  ngOnInit() {
    // Получаем уроки только на текущий день
    this.time_table$ = this.schedule$.pipe(
      map((schedule) => {
        const today = new Date().getDay(); // Получаем день недели (0 - воскресенье, 1 - понедельник и т.д.)
        return schedule
          .filter((lesson) => lesson.DayOfWeek === today.toString()) // Используем `dayOfWeek` из `LessonViewModel`
          .sort((a, b) => a.LessonNumber - b.LessonNumber); // Используем `lessonNumber` из `LessonViewModel`
      })
    );
  }

  trackByGradeId(index: number, grade: GradeViewModel): string {
    return `${grade.Subject}-${grade.Task}`; // Идентификатор оценки для отслеживания
  }

  trackByLessonSubject(index: number, lesson: LessonViewModel): string {
    return lesson.SubjectName; // Идентификатор урока для отслеживания
  }
}
