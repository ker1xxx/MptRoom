using System.IdentityModel.Tokens.Jwt;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using MptRoomAPI.DTO;
using MptRoomAPI.Models;
using MptRoomAPI.Models.Base;
using MptRoomAPI.Services;
using NuGet.Configuration;

namespace MptRoomAPI.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly UserService _userService;
        private readonly MptRoomDbContext _context;

        public AuthController(IConfiguration config, UserService userService, MptRoomDbContext context)
        {
            _config = config;
            _userService = userService;
            _context = context;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] AuthorizationDataModel model)
        {
            var user = ((IUserService)_userService).Authenticate(model.Login, model.Password);

            if (user == null)
            {
                return Unauthorized();
            }

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            SaveRefreshToken(user, refreshToken);
            return Ok(new { accessToken, refreshToken });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenDTO refreshTokenDTO)
        {
            var refreshTokenEntity = await _context.RefreshTokens
                .FirstOrDefaultAsync(rt => rt.Token == refreshTokenDTO.RefreshToken);

            if (refreshTokenEntity == null || refreshTokenEntity.ExpirationDate < DateTime.UtcNow)
            {
                return Unauthorized("Invalid or expired refresh token");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == refreshTokenEntity.UserId);
            if (user == null)
            {
                return Unauthorized("User not found");
            }

            var newAccessToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();

            refreshTokenEntity.Token = newRefreshToken;
            refreshTokenEntity.ExpirationDate = DateTime.UtcNow.AddDays(30);
            _context.SaveChanges();

            return Ok(new {accessToken = newAccessToken, refreshToken = newRefreshToken});
        }

        private void SaveRefreshToken(UserBase user, string refreshToken)
        {
            var refreshTokenEntity = new RefreshTokenModel
            {
                UserId = (int)user.UserId,
                Token = refreshToken,
                ExpirationDate = DateTime.UtcNow.AddDays(30)
            };

            _context.RefreshTokens.Add(refreshTokenEntity);
            _context.SaveChanges();
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }

        private object GenerateJwtToken(UserBase user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.AuthorizationData.Login),
            };

            if (user is StudentModel)
                claims.Add(new Claim(ClaimTypes.Role, "Student"));
            if (user is TeacherModel)
                claims.Add(new Claim(ClaimTypes.Role, "Teacher"));
            if (user is AdministratorModel)
                claims.Add(new Claim(ClaimTypes.Role, "Administrator"));

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "MptRoomBackendAPI",
                audience: "MptRoomClientApp",
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
                );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
