import { LessonViewModel } from '../VM/lesson.viewmodel';

export type DailyLessons = {
  day: string;
  lessons: LessonViewModel[];
}[];
