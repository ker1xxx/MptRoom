import { SupersedeRequestStatus } from '../enums/supersede-request-status.enum';
import { SupersedeRequestType } from '../enums/supersede-type-request.enum';

export interface LessonSupersedeRequestViewModel {
  supersedeRequestId?: number;
  teacherId: number;
  teacherName: string;
  dateToSupersede: string;
  groupId: number;
  groupName: string;
  lessonSlotId: number;
  lessonSlotName: string;
  subjectId: number;
  subjectName: string;
  requestTime: string;
  affectedLessonId?: number;
  supersedeRequestStatus: SupersedeRequestStatus;
  supersedeRequestType: SupersedeRequestType;
  hexademicalColor?: string;
}
