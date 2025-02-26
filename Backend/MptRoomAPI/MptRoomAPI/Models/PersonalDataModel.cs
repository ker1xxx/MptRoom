using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.Models
{
    public class PersonalDataModel
    {
        public int? PersonalDataId { get; set; }
        public string Name {  get; set; }
        public string Lastname { get; set; }
        public string? Patronymic { get; set; }
        public string PhoneNumber { get; set; }

    }
}
