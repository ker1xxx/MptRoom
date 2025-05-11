import { Component, Input } from '@angular/core';
import { RussianDatePipe } from '../../../../../../helper/RussianDatePipe';
import { PostViewModel } from '../../../../../../models/VM/post.viewmodel';

@Component({
  selector: 'teacher-post-header',
  imports: [RussianDatePipe],
  templateUrl: './post-header.component.html',
  styleUrl: './post-header.component.scss',
})
export class PostHeaderComponent {
  @Input() post!: PostViewModel;
}
