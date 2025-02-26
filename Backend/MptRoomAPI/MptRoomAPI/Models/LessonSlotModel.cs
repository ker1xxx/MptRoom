namespace MptRoomAPI.Models
{
    public class LessonSlotModel
    {
        public int? LessonSlotId { get; set; }
        public TimeOnly LessonStart { get; set; }
        public TimeOnly LessonEnd { get; set; }
    }
}
