import { TaskStatusEnum } from '../enums/task-status.enum';

export interface TaskDTO {
  PostId?: number;
  DueTime: string;
  SubjectId: number;
  TeacherId: number;
  CourseId: number;
  TaskStatus: TaskStatusEnum;
  StudentId: number;
  MaxMark: number;
  Mark?: number;
}
