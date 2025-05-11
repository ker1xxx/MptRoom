namespace MptRoomAPI.DTO
{
    public class CommentDTO
    {
        public int? CommentId { get; set; }
        public int PostId { get; set; }
        public string CommentText { get; set; }
        public int AuthorId { get; set; }
        public DateTime Date { get; set; }
    }
}
