import { SupersedeRequestType } from '../enums/supersede-type-request.enum';

export interface LessonViewModel {
  LessonId: number;
  SubjectId: number;
  SubjectName: string;
  GroupId: number;
  GroupName: string;
  TeacherId: number;
  TeacherName: string;
  DayOfWeek: string;
  WeekType: string;
  LessonNumber: number;
  HousingName: string;
  HexademicalColor: string;
  LessonTime: string;
  isModified?: boolean;
  modificationType?: SupersedeRequestType;
  newLessonSlot?: string;
  originalLessonSlot?: string;
}
