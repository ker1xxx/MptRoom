import { PostTypeEnum } from '../enums/post-type.enum';

export interface PostDTO {
  PostId?: number;
  PostTitle: string;
  PostDescription: string;
  PostType: PostTypeEnum;
  PostThemeId: number;
  CourseId: number;
  UserId: number;
}
