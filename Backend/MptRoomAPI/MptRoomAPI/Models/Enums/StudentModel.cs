namespace MptRoomAPI.Models.Enums
{
    public class StudentModel
    {
        public int StudentId { get; set; }
        public int PersonalDataId { get; set; }
        public int GroupId { get; set; }
        public int AuthorizationDataId { get; set; }
        public PersonalDataModel PersonalData { get; set; }
        public GroupModel Group { get; set; }
        public AuthorizationDataModel AuthorizationData { get; set; }
    }
}
