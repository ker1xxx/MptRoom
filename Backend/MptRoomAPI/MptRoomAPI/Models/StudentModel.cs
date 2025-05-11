using Azure.Core.Pipeline;
using MptRoomAPI.Models.Base;

namespace MptRoomAPI.Models
{
    public class StudentModel : UserBase
    {
        public int? GroupId { get; set; }
        public GroupModel Group { get; set; }

        public List<TaskAnswerModel> TaskAnswers { get; set; } 
        public List<CourseModel> Courses { get; set; }
        public List<SurveyAnswerModel> SurveyAnswers { get; set; } 

    }
}
