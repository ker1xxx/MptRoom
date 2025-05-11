using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.DTO
{
    public class LessonSupersedeRequestDTO
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

    }
}
