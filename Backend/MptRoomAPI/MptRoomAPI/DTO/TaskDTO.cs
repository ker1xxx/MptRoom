using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.DTO
{
    public class TaskDTO
    {
        public int? PostId { get; set; }
        public DateTime DueTime { get; set; }
        public int SubjectId { get; set; }
        public int TeacherId { get; set; }
        public int CourseId { get; set; }
        public TaskStatusEnum TaskStatus { get; set; }
        public int StudentId { get; set; }
        public int MaxMark { get; set; }
        public int? Mark { get; set; }
        public DateTime LastUpdate { get; set; }
    }
}
