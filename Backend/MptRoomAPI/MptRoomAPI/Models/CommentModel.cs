using MptRoomAPI.Models.Base;

namespace MptRoomAPI.Models
{
    public class CommentModel
    {
        public int? CommentId { get; set; }
        public int PostId { get; set; }
        public string CommentText { get; set; }
        public int AuthorId { get; set; }
        public DateTime Date { get; set; }

        public PostModel Post;
        public UserBase User;
    }
}
