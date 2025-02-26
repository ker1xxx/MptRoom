using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.Models
{
    public class GroupModel
    {
        public int? GroupId { get; set; }
        public CollegeYearEnum CourseNumber { get; set; }
        public List<StudentModel> Students { get; set; }
        public List<CourseModel> Courses { get; set; }
        public List<LessonModel> Lessons { get; set; }
    }
}
