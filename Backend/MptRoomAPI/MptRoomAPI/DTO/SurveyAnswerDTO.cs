namespace MptRoomAPI.DTO
{
    public class SurveyAnswerDTO
    {
        public int? SurveyAnswerId { get; set; }
        public int StudentId { get; set; }
        public int PostId { get; set; }
        public int SurveyOptionId { get; set; }
        public DateTime CommitTime { get; set; }
    }
}
