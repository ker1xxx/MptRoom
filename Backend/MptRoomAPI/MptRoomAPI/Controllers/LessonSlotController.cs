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
    public class LessonSlotController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<LessonSlotController> _logger;

        public LessonSlotController(MptRoomDbContext context, ILogger<LessonSlotController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<LessonSlotDTO>>> GetLessonSlots()
        {
            try
            {
                var lessonSlots = await _context.LessonSlots
                    .Select(ls => new LessonSlotDTO
                    {
                        LessonSlotId = ls.LessonSlotId,
                        LessonStart = ls.LessonStart,
                        LessonEnd = ls.LessonEnd,
                    })
                    .ToListAsync();
                return Ok(lessonSlots);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving lesson slots");
                return StatusCode(500, "An error occurred while retrieving lesson slots.");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<LessonSlotDTO>> GetLessonSlotModel(int id)
        {
            try
            {
                var lessonSlot = await _context.LessonSlots
                    .Where(ls => ls.LessonSlotId == id)
                    .Select(ls => new LessonSlotDTO
                    {
                        LessonSlotId = ls.LessonSlotId,
                        LessonStart = ls.LessonStart,
                        LessonEnd = ls.LessonEnd,
                    })
                    .FirstOrDefaultAsync();

                if (lessonSlot == null)
                {
                    return NotFound($"Lesson slot with ID {id} not found.");
                }

                return Ok(lessonSlot);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving lesson slot with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the lesson slot.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutLessonSlotModel(int id, LessonSlotDTO lessonSlotDTO)
        {
            if (id != lessonSlotDTO.LessonSlotId)
            {
                return BadRequest("Lesson slot ID mismatch.");
            }

            try
            {
                var lessonSlot = await _context.LessonSlots.FindAsync(id);
                if (lessonSlot == null)
                {
                    return NotFound($"Lesson slot with ID {id} not found.");
                }

                lessonSlot.LessonStart = lessonSlotDTO.LessonStart;
                lessonSlot.LessonEnd = lessonSlotDTO.LessonEnd;

                _context.Entry(lessonSlot).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating lesson slot");
                return StatusCode(500, "An error occurred while updating the lesson slot.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating lesson slot");
                return StatusCode(500, "An error occurred while updating the lesson slot.");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<LessonSlotDTO>> PostLessonSlotModel(LessonSlotDTO lessonSlotDTO)
        {
            try
            {
                var lessonSlot = new LessonSlotModel
                {
                    LessonStart = lessonSlotDTO.LessonStart,
                    LessonEnd = lessonSlotDTO.LessonEnd,
                };

                _context.LessonSlots.Add(lessonSlot);
                await _context.SaveChangesAsync();

                lessonSlotDTO.LessonSlotId = lessonSlot.LessonSlotId;
                return CreatedAtAction(nameof(GetLessonSlotModel), new { id = lessonSlotDTO.LessonSlotId }, lessonSlotDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating lesson slot");
                return StatusCode(500, "An error occurred while creating the lesson slot.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteLessonSlotModel(int id)
        {
            try
            {
                var lessonSlot = await _context.LessonSlots.FindAsync(id);
                if (lessonSlot == null)
                {
                    return NotFound($"Lesson slot with ID {id} not found.");
                }

                _context.LessonSlots.Remove(lessonSlot);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting lesson slot");
                return StatusCode(500, "An error occurred while deleting the lesson slot.");
            }
        }

        private bool LessonSlotModelExists(int id)
        {
            return _context.LessonSlots.Any(e => e.LessonSlotId == id);
        }
    }
}
