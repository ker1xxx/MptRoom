using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MptRoomAPI.DTO;
using MptRoomAPI.Models;

namespace MptRoomAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PersonalDataController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<PersonalDataController> _logger;

        public PersonalDataController(MptRoomDbContext context, ILogger<PersonalDataController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PersonalDataDTO>>> GetPersonalDatas()
        {
            try
            {
                var personalDatas = await _context.PersonalDatas
                    .Select(pd => new PersonalDataDTO
                    {
                        PersonalDataId = pd.PersonalDataId,
                        Name = pd.Name,
                        Lastname = pd.Lastname,
                        Patronymic = pd.Patronymic,
                        PhoneNumber = pd.PhoneNumber,
                        Email = pd.Email,
                        AvatarAbsoluteUri = pd.AvatarAbsoluteUri,
                    })
                    .ToListAsync();
                return Ok(personalDatas);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving personal data records");
                return StatusCode(500, "An error occurred while retrieving personal data records.");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<PersonalDataDTO>> GetPersonalDataModel(int id)
        {
            try
            {
                var personalData = await _context.PersonalDatas
                    .Where(pd => pd.PersonalDataId == id)
                    .Select(pd => new PersonalDataDTO
                    {
                        PersonalDataId = pd.PersonalDataId,
                        Name = pd.Name,
                        Lastname = pd.Lastname,
                        Patronymic = pd.Patronymic,
                        PhoneNumber = pd.PhoneNumber,
                        Email = pd.Email,
                        AvatarAbsoluteUri = pd.AvatarAbsoluteUri,
                    })
                    .FirstOrDefaultAsync();

                if (personalData == null)
                {
                    return NotFound($"Personal data with ID {id} not found.");
                }

                return Ok(personalData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving personal data with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the personal data record.");
            }
        }

        [HttpGet("avatar/{id}")]
        [Authorize]
        public async Task<ActionResult<PersonalDataDTO>> GetAvatar(int id)
        {
            try
            {
                var personalDataId = await _context.PersonalDatas.FirstOrDefaultAsync(pd => pd.PersonalDataId == id);

                if (personalDataId == null)
                {
                    return NotFound($"User with personal data ID {id} not found.");
                }

                string directory = "D:\\mptroomfiles\\avatars\\";
                var filePath = directory + personalDataId.PersonalDataId.ToString() + ".jpg";
                if (filePath == null)
                    return NotFound("Файл не найден в базе данных.");

                if (!System.IO.File.Exists(filePath))
                    return NotFound("Физический файл не найден на диске.");

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = GetContentType(filePath); // определяем тип контента

                var fileName = Path.GetFileName(filePath);

                return File(fileBytes, contentType, fileName);
            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении файла с ID {FileId}", id);
                return StatusCode(500, "Ошибка сервера при получении файла.");
            }
        }

        [HttpPost("avatar")]
        [Authorize]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UpdateAvatar([FromForm] IFormFile file,
        [FromForm] string userId)
        {

            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest("Файл пустой");
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == Convert.ToInt32(userId));

                if (user == null)
                    return NotFound("Пользователь не найден");
                var personalDataId = user.PersonalDataId;

                string directory = "D:\\mptroomfiles\\avatars";

                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                var filePath = Path.Combine(directory, personalDataId.ToString() + ".jpg");

                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }

                var personalData = await _context.PersonalDatas.FirstOrDefaultAsync(pd => pd.PersonalDataId == personalDataId);
                personalData!.AvatarAbsoluteUri = filePath;

                _context.PersonalDatas.Update(personalData);

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPersonalDataModel), new { id = personalData.PersonalDataId }, personalData);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating personal data record");
                return StatusCode(500, "An error occurred while updating the personal data record.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating personal data record");
                return StatusCode(500, "An error occurred while updating the personal data record.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutPersonalDataModel(int id, PersonalDataDTO personalDataDTO)
        {
            if (id != personalDataDTO.PersonalDataId)
            {
                return BadRequest("Personal data ID mismatch.");
            }

            try
            {
                var personalData = await _context.PersonalDatas.FindAsync(id);
                if (personalData == null)
                {
                    return NotFound($"Personal data with ID {id} not found.");
                }

                personalData.Name = personalDataDTO.Name;
                personalData.Lastname = personalDataDTO.Lastname;
                personalData.Patronymic = personalDataDTO.Patronymic;
                personalData.PhoneNumber = personalDataDTO.PhoneNumber;
                personalData.Email = personalDataDTO.Email;

                _context.Entry(personalData).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating personal data record");
                return StatusCode(500, "An error occurred while updating the personal data record.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating personal data record");
                return StatusCode(500, "An error occurred while updating the personal data record.");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<PersonalDataDTO>> PostPersonalDataModel(PersonalDataDTO personalDataDTO)
        {
            try
            {
                var personalData = new PersonalDataModel
                {
                    Name = personalDataDTO.Name,
                    Lastname = personalDataDTO.Lastname,
                    Patronymic = personalDataDTO.Patronymic,
                    PhoneNumber = personalDataDTO.PhoneNumber,
                    Email = personalDataDTO.Email
                };

                _context.PersonalDatas.Add(personalData);
                await _context.SaveChangesAsync();

                personalDataDTO.PersonalDataId = personalData.PersonalDataId;
                return CreatedAtAction(nameof(GetPersonalDataModel), new { id = personalDataDTO.PersonalDataId }, personalDataDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating personal data record");
                return StatusCode(500, "An error occurred while creating the personal data record.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeletePersonalDataModel(int id)
        {
            try
            {
                var personalData = await _context.PersonalDatas.FindAsync(id);
                if (personalData == null)
                {
                    return NotFound($"Personal data with ID {id} not found.");
                }

                _context.PersonalDatas.Remove(personalData);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting personal data record");
                return StatusCode(500, "An error occurred while deleting the personal data record.");
            }
        }

        private bool PersonalDataModelExists(int id)
        {
            return _context.PersonalDatas.Any(e => e.PersonalDataId == id);
        }
        private string GetContentType(string path)
        {
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(path, out var contentType))
            {
                contentType = "application/octet-stream"; // если не определили — ставим дефолт
            }
            return contentType;
        }
    }
}
