import { Component, Input } from '@angular/core';
import { TaskStatusEnum } from '../../../../../../models/enums/task-status.enum';
import { CommonModule } from '@angular/common';
import { RussianDatePipe } from '../../../../../../helper/RussianDatePipe';

@Component({
  selector: 'close-task-card',
  imports: [CommonModule, RussianDatePipe],
  templateUrl: './close-task-card.component.html',
  styleUrl: './close-task-card.component.scss',
})
export class CloseTaskCardComponent {
  status: string = 'good-mark';
  status_name: string = 'Задание выдано';
  @Input() subject_name: string = '';
  @Input() task_name: string = '';
  @Input() due_date: string = '';
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
