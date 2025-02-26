namespace MptRoomAPI.Models
{
    public class HousingModel
    {
        public int? HousingId { get; set; }
        public string HousingName { get; set; }
        public string HousingAddress { get; set; }
        public List<LessonModel> Lessons { get; set; }
    }
}
