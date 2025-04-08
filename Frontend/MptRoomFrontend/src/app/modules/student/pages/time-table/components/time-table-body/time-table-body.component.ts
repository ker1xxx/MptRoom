import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { LessonViewModel } from '../../../../../../models/VM/lesson.viewmodel';

@Component({
  selector: 'app-time-table-body',
  imports: [],
  templateUrl: './time-table-body.component.html',
  styleUrl: './time-table-body.component.scss'
})
export class TimeTableBodyComponent {
@Input() week_type$: string = '';
@Input() time_table$! : Observable<LessonViewModel[]>;
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
    
  }
  trackByLessonSubject(index: number, lesson: LessonViewModel): string {
    return lesson.SubjectName;
  }
}
