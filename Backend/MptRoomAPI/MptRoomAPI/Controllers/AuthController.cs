using System.IdentityModel.Tokens.Jwt;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Azure.Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Build.Execution;
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
        private readonly IUserService _userService;
        private readonly MptRoomDbContext _context;

        public AuthController(IConfiguration config, IUserService userService, MptRoomDbContext context)
        {
            _config = config;
            _userService = userService;
            _context = context;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] AuthorizationDataModel model)
        {
            var user = ((IUserService)_userService).Authenticate(model.Login, model.Password);

            if (user == null) return Unauthorized();

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            var role = ((IUserService)_userService).GetUserRole(user);

            _userService.SaveRefreshToken((int)user.UserId, refreshToken, DateTime.UtcNow.AddYears(1));

            // Устанавливаем куки
            Response.Cookies.Append("access_token", (string)accessToken, new CookieOptions
            {
                HttpOnly = false,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddHours(1)
            });

            Response.Cookies.Append("refresh_token", refreshToken, new CookieOptions
            {
                HttpOnly = false,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddYears(1)
            });

            return Ok(new { role });
        }

        [HttpPost("refresh")]
        public async Task<ActionResult> Refresh()
        {
            // Получаем токены из куков
            var refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken)) return Unauthorized();

            var storedToken = _userService.GetRefreshToken(refreshToken);
            if (storedToken == null || storedToken.IsRevoked || storedToken.ExpirationDate < DateTime.UtcNow)
                return Unauthorized();

            var user = await _userService.GetUserById(storedToken.UserId);
            if (user == null) return Unauthorized();

            var newAccessToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();

            _userService.SaveRefreshToken((int)user.UserId, newRefreshToken, DateTime.UtcNow.AddYears(1));

            // Обновляем куки
            Response.Cookies.Append("access_token", (string)newAccessToken, new CookieOptions
            {
                HttpOnly = false,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddHours(1)
            });

            Response.Cookies.Append("refresh_token", newRefreshToken, new CookieOptions
            {
                HttpOnly = false,
                Secure = false,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddYears(1)
            });

            return Ok();
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private object GenerateJwtToken(UserBase user)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, _context.AuthorizationDatas.FirstOrDefault(ad => ad.AuthorizationDataId == user.AuthorizationDataId).Login),
                new Claim((string)ClaimTypes.SerialNumber, user.UserId.ToString()),
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
