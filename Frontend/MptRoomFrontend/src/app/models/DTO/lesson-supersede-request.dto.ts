import { SupersedeRequestStatus } from '../enums/supersede-request-status.enum';
import { SupersedeRequestType } from '../enums/supersede-type-request.enum';

export interface LessonSupersedeRequestDTO {
  supersedeRequestId?: number;
  teacherId: number;
  groupId: number;
  dateToSupersede: string;
  lessonSlotId: number;
  subjectId: number;
  requestTime: string;
  affectedLessonId?: number;
  supersedeRequestStatus: SupersedeRequestStatus;
  supersedeRequestType: SupersedeRequestType;
}
