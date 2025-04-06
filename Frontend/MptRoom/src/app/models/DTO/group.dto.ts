import { CollegeYearEnum } from '../enums/college-year.enum';

export interface GroupDTO {
  GroupId?: number;
  GroupName: string;
  CourseNumber: CollegeYearEnum;
}
