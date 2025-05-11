import { TaskStatusEnum } from '../enums/task-status.enum';

export interface TaskDTO {
  taskId?: number;
  postId: number;
  dueTime: string;
  subjectId: number;
  teacherId: number;
  courseId: number;
  taskStatus: TaskStatusEnum;
  studentId: number;
  maxMark: number;
  mark?: number;
  lastUpdate: string;
}
