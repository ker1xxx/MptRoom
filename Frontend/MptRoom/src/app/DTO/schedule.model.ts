import { LessonModel } from './lessons.model';

export interface ScheduleModel {
  id: number;
  day: string;
  lessons: LessonModel[];
}
