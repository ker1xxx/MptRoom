namespace MptRoomAPI.Models.Enums
{
    public class GroupModel
    {
        public int GroupId { get; set; }
        public CourseNumberEnum CourseNumber { get; set; }
        public List<StudentModel> Students { get; set; }
    }
}
