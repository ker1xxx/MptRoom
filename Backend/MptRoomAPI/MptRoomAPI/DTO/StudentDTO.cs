using MptRoomAPI.Models;

namespace MptRoomAPI.DTO
{
    public class StudentDTO : UserBaseDTO
    {
        public int? GroupId { get; set; }
    }
}
