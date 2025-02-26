namespace MptRoomAPI.Models
{
    public class TaskAnswerModel
    {
        public int? TaskAnswerId { get; set; }
        public int AdditionalMaterialId { get; set; }
        public int StudentId { get; set; }
        public int PostId { get; set; }

        public AdditionalMaterialModel AdditionalMaterial { get; set; }
        public StudentModel Student { get; set; }
        public PostModel Post { get; set; }
    }
}
