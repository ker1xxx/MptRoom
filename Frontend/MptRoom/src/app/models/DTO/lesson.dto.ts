import { DayOfWeekEnum } from '../enums/day-of-week.enum';
import { WeekTypeEnum } from '../enums/week-type.enum';

export interface LessonDTO {
  LessonId?: number;
  SubjectId: number;
  GroupId: number;
  TeacherId: number;
  DayOfWeek: DayOfWeekEnum;
  WeekType: WeekTypeEnum;
  LessonNumberId: number;
  HousingId: number;
}
