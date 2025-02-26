namespace MptRoomAPI.Models
{
    public class SurveyOptionModel
    {
        public int? SurveyOptionId {  get; set; }
        public int PostId { get; set; }
        public string OptionName { get; set; }

        public PostModel Post { get; set; }
    }
}
