using MptRoomAPI.Models.Base;

namespace MptRoomAPI.Models
{
    public class RefreshTokenModel
    {
        public int? RefreshTokenId { get; set; }
        public int UserId { get; set; }
        public string Token { get; set; }
        public DateTime ExpirationDate { get; set; }
        public bool IsRevoked { get; set; }
        public UserBase User { get; set; }
    }
}
