using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.Models
{
    public class TaskModel
    {
        public int? PostId { get; set; }
        public DateTime DueTime { get; set; }
        public int SubjectId { get; set; }
        public int TeacherId { get; set; }
        public int CourseId { get; set; }
        public TaskStatusEnum TaskStatusEnum { get; set; }
        public int StudentId { get; set; }
        public int MaxMark { get; set; }
        public int? Mark { get; set; }

        public PostModel Post { get; set; }
        public SubjectModel Subject { get; set; }
        public TeacherModel Teacher { get; set; }
        public CourseModel Course { get; set; }
        public StudentModel Student { get; set; }
        public List<AdditionalMaterialModel> Materials { get; set; }
    }
}
