using Microsoft.AspNetCore.Routing.Constraints;
using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.Models
{
    public class LessonModel
    {
        public int? LessonId { get; set; }
        public int SubjectId { get; set; }
        public int GroupId { get; set; }
        public int TeacherId { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public WeekTypeEnum WeekType { get; set; }
        public int LessonNumberId { get; set; }
        public int HousingId { get; set; }

        public SubjectModel Subject { get; set; }
        public GroupModel Group { get; set; }
        public LessonSlotModel LessonNumber { get; set; }
        public HousingModel Housing { get; set; }
        public TeacherModel Teacher { get; set; }
    }
}
