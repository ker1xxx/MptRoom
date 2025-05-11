import { Component, Input } from '@angular/core';
import { PostViewModel } from '../../../../../../models/VM/post.viewmodel';
import { RussianDatePipe } from '../../../../../../helper/RussianDatePipe';

@Component({
  selector: 'app-post-header',
  imports: [RussianDatePipe],
  templateUrl: './post-header.component.html',
  styleUrl: './post-header.component.scss',
})
export class PostHeaderComponent {
  @Input() post!: PostViewModel;
}
