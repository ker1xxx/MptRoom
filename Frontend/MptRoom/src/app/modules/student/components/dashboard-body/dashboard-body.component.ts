import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecentMarkCardComponent } from '../recent-mark-card/recent-mark-card.component';
import { GradesModel } from '../../../../DTO/grades.model';
import { Observable } from 'rxjs';
import { TimeTableCardComponent } from '../time-table-card/time-table-card.component';
import { LessonModel } from '../../../../DTO/lessons.model';
import { ScheduleModel } from '../../../../DTO/schedule.model';

@Component({
  selector: 'student-dashboard-body',
  imports: [RecentMarkCardComponent, CommonModule, TimeTableCardComponent],
  templateUrl: './dashboard-body.component.html',
  styleUrl: './dashboard-body.component.scss',
})
export class DashboardBodyComponent {
  @Input() schedule$!: Observable<ScheduleModel[]>;
  @Input() grades$!: Observable<GradesModel[]>;
  time_table: LessonModel[] = [];
  grades: GradesModel[] = [];
  dayName: string = '';
  today: string = '';

  ngOnInit() {
    this.grades$.subscribe((grade) => {
      this.grades = grade;
      console.log('Оценки загружены в body', this.time_table);
    });

    this.schedule$.subscribe((schedule) => {
      this.time_table = schedule[0].lessons;
      console.log('Расписание загружено в body', this.time_table);
    });

    const daysOfWeek = [
      'Воскресенье',
      'Понедельник',
      'Вторник',
      'Среду',
      'Четверг',
      'Пятницу',
      'Субботу',
    ];

    const monthOfYear = [
      'Явнваря',
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
    console.log(this.dayName);
    this.today = today.getDate() + ' ' + monthOfYear[today.getMonth()];
    console.log(this.today);
  }
}
