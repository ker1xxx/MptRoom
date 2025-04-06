import { UserBaseDTO } from './user-base.dto';

export interface StudentDTO extends UserBaseDTO {
  groupId: number;
}
