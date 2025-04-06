namespace MptRoomAPI.Models
{
    public class SubjectModel
    {
        public int? SubjectId { get; set; }
        public string SubjectName { get; set; }
        public string HexademicalColor { get; set; }
        public List<CourseModel > Courses { get; set; }
        public List<LessonModel> Lessons { get; set; }
    }
}
