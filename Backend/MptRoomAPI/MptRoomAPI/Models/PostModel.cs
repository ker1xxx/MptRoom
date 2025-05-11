using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.Models
{
    public class PostModel
    {
        public int? PostId { get; set; }
        public string PostTitle { get; set; }
        public string PostDescription { get; set; }
        public PostTypeEnum PostType { get; set; }
        public int PostThemeId { get; set; }
        public int CourseId { get; set; }
        public int UserId { get; set; }
        public DateTime Created { get; set; }

        public PostThemeModel PostTheme{ get; set; }
        public CourseModel Course { get; set; }
        public TeacherModel Teacher { get; set; }

        public List<AdditionalMaterialModel> Materials { get; set; }
        public List<CommentModel> Comments { get; set; }
        public List<TaskModel> Tasks { get; set; }
    }
}
