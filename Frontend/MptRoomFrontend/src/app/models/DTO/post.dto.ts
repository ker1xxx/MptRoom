import { PostTypeEnum } from '../enums/post-type.enum';

export interface PostDTO {
  postId?: number;
  postTitle: string;
  postDescription: string;
  postType: PostTypeEnum;
  postThemeId: number;
  courseId: number;
  userId: number;
  created: string;
}
