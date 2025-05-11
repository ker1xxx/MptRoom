import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LessonTimePipe } from '../../../../helper/LessonTimePipe';

@Component({
  selector: 'teacher-time-table-card',
  imports: [CommonModule, LessonTimePipe],
  templateUrl: './time-table-card.component.html',
  styleUrl: './time-table-card.component.scss',
})
export class TeacherTimeTableCardComponent {
  @Input() sidebar_color?: string = '#A349F2';
  @Input() lesson_time: string = '';
  @Input() lesson_name: string = '';
  @Input() group_name: string = '';
  @Input() housing: string = '';
  @Input() subject_name: string = '';
  @Input() isModified? = false;
  @Input() modificationType: string = '';
  @Input() newLessonSlot = '';
  @Input() originalLessonSlot = '';
}
