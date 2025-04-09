import { DayOfWeekEnum } from '../enums/day-of-week.enum';
import { WeekTypeEnum } from '../enums/week-type.enum';

export interface LessonDTO {
  lessonId?: number;
  subjectId: number;
  groupId: number;
  teacherId: number;
  dayOfWeek: DayOfWeekEnum;
  weekType: WeekTypeEnum;
  lessonNumberId: number;
  housingId: number;
}
