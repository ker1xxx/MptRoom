import { SubjectDTO } from '../DTO/subject.dto';

export interface TeacherViewModel {
  userId: number;
  name: string;
  lastname: string;
  patronymic?: string;
  phoneNumber: string;
  email: string;
  login: string;
  password?: string;
  subjects: SubjectDTO[];
  personalDataId?: number;
  authorizationDataId?: number;
}
