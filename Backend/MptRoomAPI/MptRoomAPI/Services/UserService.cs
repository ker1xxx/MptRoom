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

        public void SaveRefreshToken(int userId, string token, DateTime expires)
        {
            var newtoken = _context.RefreshTokens.FirstOrDefault(rt => rt.UserId == userId);
            if (newtoken == null)
            {
                _context.RefreshTokens.Add(new RefreshTokenModel
                {
                    UserId = userId,
                    Token = token,
                    ExpirationDate = expires,
                    IsRevoked = false
                });
            }
            else {
                newtoken.Token = token;
                newtoken.ExpirationDate = expires;
                newtoken.IsRevoked = false;
            }
            _context.SaveChanges();
        }

        public RefreshTokenModel GetRefreshToken(string token)
        {
            return _context.RefreshTokens
                .FirstOrDefault(t => t.Token == token);
        }


        public void RevokeRefreshToken(string token)
        {
            var storedToken = _context.RefreshTokens
                .FirstOrDefault(t => t.Token == token);

            if (storedToken != null)
            {
                storedToken.IsRevoked = true;
                _context.SaveChanges();
            }
        }

        public async Task<UserBase> GetUserById(int userId)
        {
            try
            {
                // Проверяем Students
                var student = await _context.Students
                    .Include(s => s.AuthorizationData)
                    .FirstOrDefaultAsync(s => s.UserId == userId);

                if (student != null) return student;

                // Проверяем Teachers
                var teacher = await _context.Teachers
                    .Include(t => t.AuthorizationData)
                    .FirstOrDefaultAsync(t => t.UserId == userId);

                if (teacher != null) return teacher;

                // Проверяем Administrators
                var admin = await _context.Administrators
                    .Include(a => a.AuthorizationData)
                    .FirstOrDefaultAsync(a => a.UserId == userId);

                return admin;
            }
            catch (Exception ex)
            {
                return null; 
            }
        }
    }
}
