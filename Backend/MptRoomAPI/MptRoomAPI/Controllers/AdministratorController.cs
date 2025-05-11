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
    public class AdministratorController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<AdministratorController> _logger;

        public AdministratorController(MptRoomDbContext context, ILogger<AdministratorController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Administrator
        [HttpGet]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<IEnumerable<AdministratorDTO>>> GetAdministrators()
        {
            try
            {
                var administrators = await _context.Administrators
                    .Select(a => new AdministratorDTO
                    {
                        UserId = a.UserId,
                        PersonalDataId = a.PersonalDataId,
                        AuthorizationDataId = a.AuthorizationDataId
                    })
                    .ToListAsync();
                return Ok(administrators);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving administrators");
                return StatusCode(500, "An error occurred while retrieving administrators.");
            }
        }

        // GET: api/Administrator/5
        [HttpGet("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<AdministratorDTO>> GetAdministratorModel(int id)
        {
            try
            {
                var administrator = await _context.Administrators
                    .Where(a => a.UserId == id)
                    .Select(a => new AdministratorDTO
                    {
                        UserId = a.UserId,
                        PersonalDataId = a.PersonalDataId,
                        AuthorizationDataId = a.AuthorizationDataId
                    }).FirstOrDefaultAsync();

                if (administrator == null)
                {
                    return NotFound($"Administrator with ID {id} not found.");
                }

                return Ok(administrator);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving administrator with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the administrator.");
            }
        }

        // PUT: api/Administrator/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutAdministratorModel(int id, AdministratorDTO administratorDTO)
        {
            if (id != administratorDTO.UserId)
            {
                return BadRequest("User ID mismatch.");
            }

            try
            {
                var administrator = await _context.Administrators.FindAsync(id);
                if (administrator == null)
                {
                    return NotFound($"Administrator with ID {id} not found.");
                }

                administrator.AuthorizationDataId = administratorDTO.AuthorizationDataId;
                administrator.PersonalDataId = administratorDTO.PersonalDataId;

                _context.Entry(administrator).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating administrator");
                return StatusCode(500, "An error occurred while updating the administrator.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating administrator");
                return StatusCode(500, "An error occurred while updating the administrator.");
            }
        }

        // POST: api/Administrator
        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<AdministratorDTO>> PostAdministratorModel(AdministratorDTO administratorDTO)
        {
            try
            {
                var administrator = new AdministratorModel
                {
                    PersonalDataId = administratorDTO.PersonalDataId,
                    AuthorizationDataId = administratorDTO.AuthorizationDataId
                };

                _context.Administrators.Add(administrator);
                await _context.SaveChangesAsync();

                administratorDTO.UserId = administrator.UserId;
                return CreatedAtAction(nameof(GetAdministratorModel), new { id = administratorDTO.UserId }, administratorDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating administrator");
                return StatusCode(500, "An error occurred while creating the administrator.");
            }
        }

        // DELETE: api/Administrator/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteAdministratorModel(int id)
        {
            try
            {
                var administrator = await _context.Administrators.FindAsync(id);
                if (administrator == null)
                {
                    return NotFound($"Administrator with ID {id} not found.");
                }

                _context.Administrators.Remove(administrator);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting administrator");
                return StatusCode(500, "An error occurred while deleting the administrator.");
            }
        }

        private bool AdministratorModelExists(int id)
        {
            return _context.Administrators.Any(e => e.UserId == id);
        }
    }
}
