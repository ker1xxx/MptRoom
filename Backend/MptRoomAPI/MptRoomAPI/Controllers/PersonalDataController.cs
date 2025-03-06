using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
                        PhoneNumber = pd.PhoneNumber
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
                        PhoneNumber = pd.PhoneNumber
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

                _context.Entry(personalData).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
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
                    PhoneNumber = personalDataDTO.PhoneNumber
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

                return NoContent();
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
    }
}
