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
    public class LessonController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<LessonController> _logger;

        public LessonController(MptRoomDbContext context, ILogger<LessonController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<LessonDTO>>> GetLessons()
        {
            try
            {
                var lessons = await _context.Lessons
                    .Select(l => new LessonDTO
                    {
                        LessonId = l.LessonId,
                        SubjectId = l.SubjectId,
                        GroupId = l.GroupId,
                        TeacherId = l.TeacherId,
                        DayOfWeek = l.DayOfWeek,
                        WeekType = l.WeekType,
                        LessonNumberId = l.LessonNumberId,
                        HousingId = l.HousingId,
                    })
                    .ToListAsync();
                return Ok(lessons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving lessons");
                return StatusCode(500, "An error occurred while retrieving lessons.");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<LessonDTO>> GetLessonModel(int id)
        {
            try
            {
                var lesson = await _context.Lessons
                    .Where(l => l.LessonId == id)
                    .Select(l => new LessonDTO
                    {
                        LessonId = l.LessonId,
                        SubjectId = l.SubjectId,
                        GroupId = l.GroupId,
                        TeacherId = l.TeacherId,
                        DayOfWeek = l.DayOfWeek,
                        WeekType = l.WeekType,
                        LessonNumberId = l.LessonNumberId,
                        HousingId = l.HousingId
                    })
                    .FirstOrDefaultAsync();

                if (lesson == null)
                {
                    return NotFound($"Lesson with ID {id} not found.");
                }

                return Ok(lesson);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving lesson with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the lesson.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutLessonModel(int id, LessonDTO lessonDTO)
        {
            if (id != lessonDTO.LessonId)
            {
                return BadRequest("Lesson ID mismatch.");
            }

            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null)
                {
                    return NotFound($"Lesson with ID {id} not found.");
                }

                lesson.SubjectId = lessonDTO.SubjectId;
                lesson.GroupId = lessonDTO.GroupId;
                lesson.TeacherId = lessonDTO.TeacherId;
                lesson.DayOfWeek = lessonDTO.DayOfWeek;
                lesson.WeekType = lessonDTO.WeekType;
                lesson.LessonNumberId = lessonDTO.LessonNumberId;
                lesson.HousingId = lessonDTO.HousingId;

                _context.Entry(lesson).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating lesson");
                return StatusCode(500, "An error occurred while updating the lesson.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating lesson");
                return StatusCode(500, "An error occurred while updating the lesson.");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<LessonDTO>> PostLessonModel(LessonDTO lessonDTO)
        {
            try
            {
                var lesson = new LessonModel
                {
                    SubjectId = lessonDTO.SubjectId,
                    GroupId = lessonDTO.GroupId,
                    TeacherId = lessonDTO.TeacherId,
                    DayOfWeek = lessonDTO.DayOfWeek,
                    WeekType = lessonDTO.WeekType,
                    LessonNumberId = lessonDTO.LessonNumberId,
                    HousingId = lessonDTO.HousingId
                };

                _context.Lessons.Add(lesson);
                await _context.SaveChangesAsync();

                lessonDTO.LessonId = lesson.LessonId;
                return CreatedAtAction(nameof(GetLessonModel), new { id = lessonDTO.LessonId }, lessonDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating lesson");
                return StatusCode(500, "An error occurred while creating the lesson.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteLessonModel(int id)
        {
            try
            {
                var lesson = await _context.Lessons.FindAsync(id);
                if (lesson == null)
                {
                    return NotFound($"Lesson with ID {id} not found.");
                }

                _context.Lessons.Remove(lesson);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting lesson");
                return StatusCode(500, "An error occurred while deleting the lesson.");
            }
        }

        private bool LessonModelExists(int id)
        {
            return _context.Lessons.Any(e => e.LessonId == id);
        }
    }
}
