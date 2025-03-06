using MptRoomAPI.Models.Base;

namespace MptRoomAPI.Models
{
    public class AdditionalMaterialModel
    {
        public int? AdditionalMaterialId { get; set; }
        public string UriAbsolutePath { get; set; }
        public int UserId { get; set; }
        public UserBase User { get; set; }
    }
}
