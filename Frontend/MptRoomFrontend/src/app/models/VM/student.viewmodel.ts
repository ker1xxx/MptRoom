export interface StudentViewModel {
  userId: number;
  name: string;
  lastname: string;
  patronymic: string;
  phoneNumber: string;
  email: string;
  login: string;
  password?: string;
  authorizationDataId?: number;
  groupId: number;
  groupName: string;
  avatarAbsoluteUri?: string;
}
