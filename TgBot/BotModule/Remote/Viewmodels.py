from typing import Dict, Optional, List, Union
from Remote.Enums import *
from pydantic import BaseModel, HttpUrl

from Remote.DTO import SubjectDTO


class SupersedeRequestViewModel(BaseModel):
    RequestId: int
    Date: str
    Status: str
    Type: str
    SubjectName: str
    GroupName: str


class LessonViewModel(BaseModel):
    LessonId: int
    SubjectName: str
    GroupName: str
    LessonTime: str
    HousingName: str
    DayOfWeek: str
    weekType: WeekTypeEnum


class TeacherViewModel(BaseModel):
    userId: int
    name: str
    lastname: str
    patronymic: Optional[str]
    phoneNumber: str
    email: str
    login: str
    password: Optional[str]
    subjects: List[SubjectDTO]
    personalDataId: Optional[int]
    authorizationDataId: Optional[int]


LessonViewModel.update_forward_refs()
