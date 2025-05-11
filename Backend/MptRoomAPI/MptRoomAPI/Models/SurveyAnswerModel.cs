namespace MptRoomAPI.Models
{
    public class SurveyAnswerModel
    {
        public int? SurveyAnswerId { get; set; }
        public int StudentId { get; set; }
        public int PostId { get; set; }
        public int SurveyOptionId { get; set; }
        public DateTime CommitTime { get; set; }

        public StudentModel Student { get; set; }
        public PostModel Post { get; set; }
        public SurveyOptionModel SurveyOption { get; set; }
    }
}
