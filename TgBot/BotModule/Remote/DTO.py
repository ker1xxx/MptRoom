from pydantic import BaseModel
from typing import Optional
from Remote.Enums import *

class UserBaseDTO(BaseModel):
    userId: Optional[int] = None
    personalDataId: Optional[int] = None
    authorizationDataId: Optional[int] = None


class AuthorizationDataDTO(BaseModel):
    authorizationDataId: Optional[int] = None
    login: str
    password: str


class GroupDTO(BaseModel):
    groupId: Optional[int] = None
    groupName: str


class HousingDTO(BaseModel):
    housingId: Optional[int] = None
    housingName: str
    housingAddress: str


class LessonSlotDTO(BaseModel):
    lessonSlotId: Optional[int] = None
    lessonStart: str  # Можно заменить на datetime, если используется ISO формат
    lessonEnd: str


class LessonSupersedeRequestDTO(BaseModel):
    supersedeRequestId: Optional[int] = None
    teacherId: int
    groupId: int
    dateToSupersede: str
    lessonSlotId: int
    subjectId: int
    requestTime: str
    affectedLessonId: Optional[int] = None
    supersedeRequestStatus: SupersedeRequestStatus
    supersedeRequestType: SupersedeRequestType


class LessonDTO(BaseModel):
    lessonId: Optional[int] = None
    subjectId: int
    groupId: int
    teacherId: int
    dayOfWeek: DayOfWeekEnum
    weekType: WeekTypeEnum
    lessonNumberId: int
    housingId: int


class PersonalDataDTO(BaseModel):
    personalDataId: Optional[int] = None
    name: str
    lastname: str
    patronymic: Optional[str] = None
    phoneNumber: str
    email: str
    avatarAbsoluteUri: Optional[str] = None


class RefreshTokenDTO(BaseModel):
    refreshToken: str


class SubjectDTO(BaseModel):
    subjectId: Optional[int] = None
    subjectName: str
    hexademicalColor: str


class TeacherDTO(UserBaseDTO):
    pass
