import { CommonModule } from '@angular/common';
import { Component, input, Input } from '@angular/core';

@Component({
  selector: 'student-recent-mark-card',
  imports: [CommonModule],
  templateUrl: './recent-mark-card.component.html',
  styleUrl: './recent-mark-card.component.scss',
})
export class RecentMarkCardComponent {
  status: string = 'good-mark';
  @Input() subject_name: string = '';
  @Input() task_name: string = '';
  @Input() due_date: string = '';
  @Input() mark: string = '';
  @Input() sidebar_color?: string = '#A349F2';

  ngOnInit() {
    const current_mark = Number(this.mark.split('/')[0]);
    const max_mark = Number(this.mark.split('/')[1]);
    const mark_percentage = current_mark / max_mark;
    if (mark_percentage > 0.6) this.status = 'good-mark';
    else if (0.6 >= mark_percentage && mark_percentage > 0.4)
      this.status = 'satisfactorily-mark';
    else this.status = 'bad-mark';
  }
}
