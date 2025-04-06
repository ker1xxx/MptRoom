using MptRoomAPI.Models.Base;

namespace MptRoomAPI.Services
{
    public interface IUserService
    {
        UserBase? Authenticate(string login, string password);
        string GetUserRole(UserBase user);
    }
}
