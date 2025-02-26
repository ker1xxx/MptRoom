using MptRoomAPI.Models.Base;

namespace MptRoomAPI.Models
{
    public class TeacherModel : UserBase
    {
        public List<LessonModel> Lessons { get; set; }
        public List<CourseModel> Courses { get; set; }
    }
}
