using System.Text.Json.Serialization;
using MptRoomAPI.Models.Base;

namespace MptRoomAPI.Models
{
    public class AdditionalMaterialModel
    {
        public int? AdditionalMaterialId { get; set; }
        public string UriAbsolutePath { get; set; }
        public int UserId { get; set; }
        public int? PostId { get; set; }

        public PostModel Post { get; set; }
        [JsonIgnore]
        public UserBase User { get; set; }
    }
}
