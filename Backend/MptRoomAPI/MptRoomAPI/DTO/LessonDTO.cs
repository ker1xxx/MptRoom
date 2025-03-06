using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.DTO
{
    public class LessonDTO
    {
        public int? LessonId { get; set; }
        public int SubjectId { get; set; }
        public int GroupId { get; set; }
        public int TeacherId { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public WeekTypeEnum WeekType { get; set; }
        public int LessonNumberId { get; set; }
        public int HousingId { get; set; }
    }
}
