namespace MptRoomAPI.Models
{
    public class AuthorizationDataModel
    {
        public int? AuthorizationDataId { get; set; }
        public string Login { get; set; }
        public string Password { get; set; }
        public string PasswordSalt { get; set; }
    }
}
