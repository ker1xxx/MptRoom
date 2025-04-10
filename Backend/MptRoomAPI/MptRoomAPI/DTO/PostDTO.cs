using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.DTO
{
    public class PostDTO
    {
        public int? PostId { get; set; }
        public string PostTitle { get; set; }
        public string PostDescription { get; set; }
        public PostTypeEnum PostType { get; set; }
        public int PostThemeId { get; set; }
        public int CourseId { get; set; }
        public int UserId { get; set; }
        public DateTime Created { get; set; }
    }
}
