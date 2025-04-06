using BCrypt.Net;
using MptRoomAPI.Models.Base;
using MptRoomAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MptRoomAPI.Services
{
    public class UserService : IUserService
    {
        private readonly MptRoomDbContext _context;
        public UserService(MptRoomDbContext context)
        {
            _context = context;
        }

        public UserBase Authenticate(string login, string password)
        {
            var user = _context.Users.Include(u => u.AuthorizationData).FirstOrDefault(u => u.AuthorizationData.Login == login);
            if (user == null || !VerifyPassword(password, user.AuthorizationData.Password))
            {
                return null;
            }
            return user;
        }
        public string GetUserRole(UserBase user)
        {
            return user switch
            {
                AdministratorModel => "Administrator",
                TeacherModel => "Teacher",
                StudentModel => "Student",
                _ => "User"
            };
        }

        private bool VerifyPassword(string password, string storedPassword) => BCrypt.Net.BCrypt.Verify(password, storedPassword);

        public string HashPassword(string password) => BCrypt.Net.BCrypt.HashPassword(password);
    }
}
