import { LessonViewModel } from '../VM/lesson.viewmodel';

export interface DailyLesson {
  day: string;
  lessons: LessonViewModel[];
  housings: string[];
}
