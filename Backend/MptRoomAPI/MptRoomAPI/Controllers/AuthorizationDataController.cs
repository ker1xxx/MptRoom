using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MptRoomAPI.DTO;
using MptRoomAPI.Models;
using Microsoft.Extensions.Logging;

namespace MptRoomAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthorizationDataController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<AuthorizationDataController> _logger;

        public AuthorizationDataController(MptRoomDbContext context, ILogger<AuthorizationDataController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/AuthorizationData
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuthorizationDataDTO>>> GetAuthorizationDatas()
        {
            try
            {
                var authorizationDatas = await _context.AuthorizationDatas
                    .Select(ad => new AuthorizationDataDTO
                    {
                        AuthorizationDataId = ad.AuthorizationDataId,
                        Login = ad.Login,
                        Password = ad.Password
                    })
                    .ToListAsync();

                return Ok(authorizationDatas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении списка данных авторизации.");
                return StatusCode(500, "Внутренняя ошибка сервера.");
            }
        }

        // GET: api/AuthorizationData/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<AuthorizationDataDTO>> GetAuthorizationDataModel(int? id)
        {
            if (id == null)
                return BadRequest("ID не может быть null.");

            try
            {
                var authorizationData = await _context.AuthorizationDatas
                    .Where(ad => ad.AuthorizationDataId == id)
                    .Select(ad => new AuthorizationDataDTO
                    {
                        AuthorizationDataId = ad.AuthorizationDataId,
                        Login = ad.Login
                    })
                    .FirstOrDefaultAsync();

                if (authorizationData == null)
                    return NotFound("Запись с указанным ID не найдена.");

                return Ok(authorizationData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении данных авторизации.");
                return StatusCode(500, "Внутренняя ошибка сервера.");
            }
        }

        // PUT: api/AuthorizationData/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutAuthorizationDataModel(int? id, AuthorizationDataDTO authorizationDataDTO)
        {
            if (id == null || id != authorizationDataDTO.AuthorizationDataId)
                return BadRequest("Некорректный ID.");

            try
            {
                bool exists = await _context.AuthorizationDatas.AnyAsync(ad => ad.AuthorizationDataId == id);
                if (!exists)
                    return NotFound("Запись для обновления не найдена.");

                var authorizationData = await _context.AuthorizationDatas.FindAsync(id);
                if (authorizationData == null)
                    return NotFound();

                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(authorizationDataDTO.Password);


                authorizationData.Login = authorizationDataDTO.Login;
                authorizationData.Password = hashedPassword;

                _context.Entry(authorizationData).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении данных авторизации.");
                return StatusCode(500, "Ошибка сервера при обновлении данных.");
            }
        }

        // POST: api/AuthorizationData
        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<AuthorizationDataDTO>> PostAuthorizationDataModel(AuthorizationDataDTO authorizationDataDTO)
        {
            if (string.IsNullOrWhiteSpace(authorizationDataDTO.Login) ||
                string.IsNullOrWhiteSpace(authorizationDataDTO.Password))
            {
                return BadRequest("Логин и пароль обязательны.");
            }

            try
            {
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(authorizationDataDTO.Password);

                var authorizationData = new AuthorizationDataModel
                {
                    Login = authorizationDataDTO.Login,
                    Password = hashedPassword
                };

                _context.AuthorizationDatas.Add(authorizationData);
                await _context.SaveChangesAsync();

                authorizationDataDTO.AuthorizationDataId = authorizationData.AuthorizationDataId;

                return CreatedAtAction(nameof(GetAuthorizationDataModel),
                    new { id = authorizationDataDTO.AuthorizationDataId }, authorizationDataDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при создании данных авторизации.");
                return StatusCode(500, "Ошибка сервера при создании данных.");
            }
        }

        // DELETE: api/AuthorizationData/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteAuthorizationDataModel(int? id)
        {
            if (id == null)
                return BadRequest("ID не может быть null.");

            try
            {
                var authorizationDataModel = await _context.AuthorizationDatas.FindAsync(id);
                if (authorizationDataModel == null)
                    return NotFound("Запись не найдена.");

                _context.AuthorizationDatas.Remove(authorizationDataModel);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении данных авторизации.");
                return StatusCode(500, "Ошибка сервера при удалении данных.");
            }
        }

        private bool AuthorizationDataModelExists(int? id)
        {
            return _context.AuthorizationDatas.Any(e => e.AuthorizationDataId == id);
        }
    }
}
