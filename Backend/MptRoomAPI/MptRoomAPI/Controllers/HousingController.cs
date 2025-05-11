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
    public class HousingController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<HousingController> _logger;

        public HousingController(MptRoomDbContext context, ILogger<HousingController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<HousingDTO>>> GetHousings()
        {
            try
            {
                var housings = await _context.Housings
                    .Select(h => new HousingDTO
                    {
                        HousingId = h.HousingId,
                        HousingName = h.HousingName,
                        HousingAddress = h.HousingAddress,
                    })
                    .ToListAsync();
                return Ok(housings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving housings");
                return StatusCode(500, "An error occurred while retrieving housings.");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<HousingDTO>> GetHousingModel(int id)
        {
            try
            {
                var housing = await _context.Housings
                    .Where(h => h.HousingId == id)
                    .Select(h => new HousingDTO
                    {
                        HousingId = h.HousingId,
                        HousingName = h.HousingName,
                        HousingAddress = h.HousingAddress,
                    })
                    .FirstOrDefaultAsync();

                if (housing == null)
                {
                    return NotFound($"Housing with ID {id} not found.");
                }

                return Ok(housing);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving housing with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the housing.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutHousingModel(int id, HousingDTO housingDTO)
        {
            if (id != housingDTO.HousingId)
            {
                return BadRequest("Housing ID mismatch.");
            }

            try
            {
                var housing = await _context.Housings.FindAsync(id);
                if (housing == null)
                {
                    return NotFound($"Housing with ID {id} not found.");
                }

                housing.HousingName = housingDTO.HousingName;
                housing.HousingAddress = housingDTO.HousingAddress;

                _context.Entry(housing).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating housing");
                return StatusCode(500, "An error occurred while updating the housing.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating housing");
                return StatusCode(500, "An error occurred while updating the housing.");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<HousingDTO>> PostHousingModel(HousingDTO housingDTO)
        {
            try
            {
                var housing = new HousingModel
                {
                    HousingName = housingDTO.HousingName,
                    HousingAddress = housingDTO.HousingAddress,
                };

                _context.Housings.Add(housing);
                await _context.SaveChangesAsync();

                housingDTO.HousingId = housing.HousingId;
                return CreatedAtAction(nameof(GetHousingModel), new { id = housingDTO.HousingId }, housingDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating housing");
                return StatusCode(500, "An error occurred while creating the housing.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteHousingModel(int id)
        {
            try
            {
                var housing = await _context.Housings.FindAsync(id);
                if (housing == null)
                {
                    return NotFound($"Housing with ID {id} not found.");
                }

                _context.Housings.Remove(housing);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting housing");
                return StatusCode(500, "An error occurred while deleting the housing.");
            }
        }

        private bool HousingModelExists(int id)
        {
            return _context.Housings.Any(e => e.HousingId == id);
        }
    }
}
