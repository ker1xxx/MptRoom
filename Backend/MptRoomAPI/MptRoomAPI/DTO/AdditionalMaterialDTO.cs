using MptRoomAPI.Models.Base;

namespace MptRoomAPI.DTO
{
    public class AdditionalMaterialDTO
    {
        public int? AdditionalMaterialId { get; set; }
        public string UriAbsolutePath { get; set; }
        public int UserId { get; set; }
    }
}
