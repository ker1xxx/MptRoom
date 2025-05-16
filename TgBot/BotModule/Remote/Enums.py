from enum import Enum

class DayOfWeekEnum(int, Enum):
    Sunday = 0
    Monday = 1
    Tuesday = 2
    Wednesday = 3
    Thursday = 4
    Friday = 5
    Saturday = 6

class SupersedeRequestStatus(int, Enum):
    sent = 1
    approved = 2
    declined = 3

class SupersedeRequestType(int, Enum):
    moved = 1
    canceled = 2
    added = 3
    replaced = 4

class WeekTypeEnum(int, Enum):
    any = 0
    odd = 1
    even = 2