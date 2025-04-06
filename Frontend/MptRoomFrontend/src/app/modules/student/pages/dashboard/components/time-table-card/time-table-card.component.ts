import { Component, Input } from '@angular/core';

@Component({
  selector: 'time-table-card',
  imports: [],
  templateUrl: './time-table-card.component.html',
  styleUrl: './time-table-card.component.scss',
})
export class TimeTableCardComponent {
  @Input() sidebar_color?: string = '#A349F2';
  @Input() lesson_time: string = '';
  @Input() lesson_name: string = '';
  @Input() teacher_name: string = '';
}
