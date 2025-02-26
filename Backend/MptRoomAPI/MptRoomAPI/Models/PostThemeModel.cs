namespace MptRoomAPI.Models
{
    public class PostThemeModel
    {
        public int? PostThemeId { get; set; }
        public string PostThemeText { get; set; }

        public List<PostModel> Posts { get; set; }
    }
}
