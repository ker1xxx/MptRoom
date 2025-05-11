namespace MptRoomAPI.DTO
{
    public class PersonalDataDTO
    {
        public int? PersonalDataId { get; set; }
        public string Name { get; set; }
        public string Lastname { get; set; }
        public string? Patronymic { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string? AvatarAbsoluteUri { get; set; }
    }
}
