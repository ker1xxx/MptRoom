namespace MptRoomAPI.Models
{
    public class CourseModel
    {
        public int? CourseId { get; set; }
        public int GroupId { get; set; }
        public int SubjectId { get; set; }
        public int TeacherId { get; set; }
        
        public GroupModel Group { get; set; }
        public SubjectModel Subject { get; set; }
        public TeacherModel Teacher { get; set; }

        public List<PostModel> Posts { get; set; }
    }
}
