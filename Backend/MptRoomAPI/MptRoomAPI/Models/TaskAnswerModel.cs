namespace MptRoomAPI.Models
{
    public class TaskAnswerModel
    {
        public int? TaskAnswerId { get; set; }
        public int? AdditionalMaterialId { get; set; }
        public int StudentId { get; set; }
        public int TaskId { get; set; }
        public DateTime AssignmentTime { get; set; }

        public AdditionalMaterialModel AdditionalMaterial { get; set; }
        public StudentModel Student { get; set; }
        public TaskModel Task { get; set; }
    }
}
    