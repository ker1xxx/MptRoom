import { SafeResourceUrl } from '@angular/platform-browser';

export interface CommentViewModel {
  commentId?: number;
  postId: number;
  commentText: string;
  authorId: number;
  authorName: string;
  authorAvatar: SafeResourceUrl;
  date: string;
}
