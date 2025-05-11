import { SafeResourceUrl } from '@angular/platform-browser';
import { TaskViewModel } from './task.viewmodel';

export interface CourseViewModel {
  courseId?: number;
  hash?: string;
  courseName: string;
  groupId?: number;
  groupName: string;
  subjectId: number;
  subjectName: string;
  teacherId: number;
  teacherName: string;
  hexademicalColor: string;
  nearestTask?: TaskViewModel;
  teacherAvatarUrl?: SafeResourceUrl | string;
}
