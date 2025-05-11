using MptRoomAPI.Models;
using MptRoomAPI.Models.Base;

namespace MptRoomAPI.Services
{
    public interface IUserService
    {
        UserBase? Authenticate(string login, string password);
        string GetUserRole(UserBase user);
        void SaveRefreshToken(int userId, string token, DateTime expires);
        RefreshTokenModel GetRefreshToken(string token);
        void RevokeRefreshToken(string token);
        Task<UserBase> GetUserById(int userId);
    }
}
