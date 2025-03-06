using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.DTO
{
    public class GroupDTO
    {
        public int? GroupId { get; set; }
        public string GroupName { get; set; }
        public CollegeYearEnum CourseNumber { get; set; }
    }
}
