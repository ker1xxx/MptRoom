namespace MptRoomAPI.DTO
{
    public class LessonSlotDTO
    {
        public int? LessonSlotId { get; set; }
        public TimeOnly LessonStart { get; set; }
        public TimeOnly LessonEnd { get; set; }
    }
}
