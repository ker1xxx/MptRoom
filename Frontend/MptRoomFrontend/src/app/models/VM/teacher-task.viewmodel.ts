import { TaskStatusEnum } from '../enums/task-status.enum';

export interface TeacherTaskViewModel {
  taskId?: number;
  sidebarColor: string;
  dueTime: string;
  courseName: string;
  courseId: number;
  postId: number;
  subjectName: string;
  studentName: string;
  taskName: string;
  taskStatus: TaskStatusEnum;
  mark?: number;
  maxMark: number;
  description: string;
  assingmentDate: string;
}
