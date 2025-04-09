import { TaskStatusEnum } from '../enums/task-status.enum';

export interface TaskViewModel {
  sidebarColor: string;
  dueTime: string;
  subjectName: string;
  teacherName: string;
  taskName: string;
  taskStatus: TaskStatusEnum;
}
