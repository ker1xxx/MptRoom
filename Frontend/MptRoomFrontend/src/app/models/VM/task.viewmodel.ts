import { TaskStatusEnum } from '../enums/task-status.enum';

export interface TaskViewModel {
  taskId?: number;
  postId: number;
  courseId?: number;
  sidebarColor: string;
  dueTime: string;
  subjectName: string;
  teacherName: string;
  taskName: string;
  taskStatus: TaskStatusEnum;
  mark?: number;
  maxMark: number;
  description: string;
  lastUpdate: string;
  studentId?: number;
}
