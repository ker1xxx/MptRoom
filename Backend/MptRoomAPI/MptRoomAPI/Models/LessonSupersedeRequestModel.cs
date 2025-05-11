using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.Models
{
    public class LessonSupersedeRequestModel
    {
        public int? SupersedeRequestId { get; set; }
        public int TeacherId { get; set; }
        public int GroupId { get; set; }
        public DateOnly DateToSupersede { get; set; }
        public int LessonSlotId { get; set; }
        public int SubjectId { get; set; }
        public DateTime RequestTime { get; set; }
        public int? AffectedLessonId { get; set; }
        public SupersedeRequestStatusEnum SupersedeRequestStatus { get; set; }
        public SupersedeRequestTypeEnum SupersedeRequestType { get; set; }

        public GroupModel Group { get; set; }
        public TeacherModel Teacher { get; set; }
        public LessonSlotModel LessonSlot { get; set; }
        public SubjectModel Subject { get; set; }
        public LessonModel Lesson { get; set; }
    }
}
