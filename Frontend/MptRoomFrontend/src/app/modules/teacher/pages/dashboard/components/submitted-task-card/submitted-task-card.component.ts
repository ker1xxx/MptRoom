import { Component, Input } from '@angular/core';
import { TaskStatusEnum } from '../../../../../../models/enums/task-status.enum';
import { CommonModule } from '@angular/common';
import { RussianDatePipe } from '../../../../../../helper/RussianDatePipe';

@Component({
  selector: 'submitted-task-card',
  imports: [CommonModule, RussianDatePipe],
  templateUrl: './submitted-task-card.component.html',
  styleUrl: './submitted-task-card.component.scss',
})
export class SubmittedTaskCardComponent {
  status: string = 'good-mark';
  status_name: string = 'Задание выдано';
  @Input() student_name: string = '';
  @Input() task_name: string = '';
  @Input() assignment_date: string = '';
  @Input() task_status: number = 0;
  @Input() sidebar_color?: string = '#A349F2';

  ngOnInit() {
    switch (this.task_status) {
      case TaskStatusEnum.Appointed:
        this.status = 'appointed-task';
        this.status_name = 'Задание выдано';
        break;
      case TaskStatusEnum.DeadlineMissed:
        this.status = 'deadline-missed-task';
        this.status_name = 'Пропущен срок сдачи';
        break;
      case TaskStatusEnum.Submitted:
        this.status = 'submitted-task';
        this.status_name = 'Сдано на проверку';
        break;
    }
  }
}
