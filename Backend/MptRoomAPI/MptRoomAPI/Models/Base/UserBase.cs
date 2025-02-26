namespace MptRoomAPI.Models.Base
{
    public class UserBase
    {
        public int? UserId { get; set; }
        public int PersonalDataId { get; set; }
        public int AuthorizationDataId { get; set; }
        public PersonalDataModel PersonalData { get; set; }
        public AuthorizationDataModel AuthorizationData { get; set; }
        public List<AdditionalMaterialModel> Materials { get; set; }
        public List<PostModel> Posts { get; set; }

    }
}
