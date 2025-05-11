namespace MptRoomAPI.DTO
{
    public class TaskAnswerDTO
    {
        public int? TaskAnswerId { get; set; }
        public int? AdditionalMaterialId { get; set; }
        public int StudentId { get; set; }
        public int TaskId { get; set; }
        public DateTime AssignmentTime { get; set;  }
    }
}
