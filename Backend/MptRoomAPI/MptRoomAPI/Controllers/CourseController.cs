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
    public class CourseController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<CourseController> _logger;

        public CourseController(MptRoomDbContext context, ILogger<CourseController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<CourseDTO>>> GetCourses()
        {
            try
            {
                var courses = await _context.Courses
                    .Select(c => new CourseDTO
                    {
                        CourseId = c.CourseId,
                        GroupId = c.GroupId,
                        SubjectId = c.SubjectId,
                        TeacherId = c.TeacherId,
                    })
                    .ToListAsync();
                return Ok(courses);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving courses");
                return StatusCode(500, "An error occurred while retrieving courses.");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<CourseDTO>> GetCourseModel(int id)
        {
            try
            {
                var course = await _context.Courses
                    .Where(c => c.CourseId == id)
                    .Select(c => new CourseDTO
                    {
                        CourseId = c.CourseId,
                        GroupId = c.GroupId,
                        SubjectId = c.SubjectId,
                        TeacherId = c.TeacherId,
                    })
                    .FirstOrDefaultAsync();

                if (course == null)
                {
                    return NotFound($"Course with Group ID {id} not found.");
                }

                return Ok(course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving course with Group ID {id}");
                return StatusCode(500, "An error occurred while retrieving the course.");
            }
        }

        [HttpGet("student/{student_id}")]
        [Authorize]
        public async Task<ActionResult<CourseDTO>> GetCourseForStudent(int student_id)
        {
            try
            {
                var group = await _context.Groups.FirstOrDefaultAsync(g => g.Students.Any(s => s.UserId == student_id));
                if (group == null)
                {
                    return NotFound($"Course with student {student_id} not found.");
                }
                var course = await _context.Courses
                    .Where(c => c.GroupId == group.GroupId)
                    .Select(c => new CourseDTO
                    {
                        CourseId = c.CourseId,
                        GroupId = c.GroupId,
                        SubjectId = c.SubjectId,
                        TeacherId = c.TeacherId,
                    })
                    .ToListAsync();

                if (course == null)
                {
                    return NotFound($"Course with Group ID {student_id} not found.");
                }

                return Ok(course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving course with Group ID {student_id}");
                return StatusCode(500, "An error occurred while retrieving the course.");
            }
        }

        [HttpGet("teacher/{teacher_id}")]
        [Authorize]
        public async Task<ActionResult<CourseDTO>> GetCourseForTeacher(int teacher_id)
        {
            try
            {
                    var course = await _context.Courses
                    .Where(c => c.TeacherId == teacher_id)
                    .Select(c => new CourseDTO
                    {
                        CourseId = c.CourseId,
                        GroupId = c.GroupId,
                        SubjectId = c.SubjectId,
                        TeacherId = c.TeacherId,
                    })
                    .ToListAsync();

                if (course == null)
                {
                    return NotFound($"Course with Teacher Id {teacher_id} not found.");
                }

                return Ok(course);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving course with Teacher Id {teacher_id}");
                return StatusCode(500, "An error occurred while retrieving the course.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutCourseModel(int id, CourseDTO courseDTO)
        {
            if (id != courseDTO.CourseId)
            {
                return BadRequest("Course ID mismatch.");
            }

            try
            {
                var course = await _context.Courses.FindAsync(id);
                if (course == null)
                {
                    return NotFound($"Course with ID {id} not found.");
                }

                course.SubjectId = courseDTO.SubjectId;
                course.TeacherId = courseDTO.TeacherId;
                course.GroupId = courseDTO.GroupId;

                _context.Entry(course).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating course");
                return StatusCode(500, "An error occurred while updating the course.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating course");
                return StatusCode(500, "An error occurred while updating the course.");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<CourseDTO>> PostCourseModel(CourseDTO courseDTO)
        {
            try
            {
                var course = new CourseModel
                {
                    GroupId = courseDTO.GroupId,
                    SubjectId = courseDTO.SubjectId,
                    TeacherId = courseDTO.TeacherId,
                };

                _context.Courses.Add(course);
                await _context.SaveChangesAsync();

                courseDTO.CourseId = course.CourseId;
                return CreatedAtAction(nameof(GetCourseModel), new { id = courseDTO.CourseId }, courseDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating course");
                return StatusCode(500, "An error occurred while creating the course.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteCourseModel(int id)
        {
            try
            {
                var course = await _context.Courses.FindAsync(id);
                if (course == null)
                {
                    return NotFound($"Course with ID {id} not found.");
                }

                _context.Courses.Remove(course);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting course");
                return StatusCode(500, "An error occurred while deleting the course.");
            }
        }

        private bool CourseModelExists(int id)
        {
            return _context.Courses.Any(e => e.CourseId == id);
        }
    }
}
