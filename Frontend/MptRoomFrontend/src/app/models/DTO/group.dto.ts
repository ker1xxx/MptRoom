import { CollegeYearEnum } from '../enums/college-year.enum';

export interface GroupDTO {
  groupId?: number;
  groupName: string;
  courseNumber: CollegeYearEnum;
}
