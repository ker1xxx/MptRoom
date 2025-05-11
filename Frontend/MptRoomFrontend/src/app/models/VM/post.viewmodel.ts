import { PostTypeEnum } from '../enums/post-type.enum';

export interface PostViewModel {
  id: number;
  hash?: string;
  title: string;
  theme: string;
  description: string;
  type: PostTypeEnum;
  typeName: string;
  date: string;
  author: string;
  authorId: number;
  courseId: number;
  courseName?: string;
  groupId: number;
  subjectId: number;
}
