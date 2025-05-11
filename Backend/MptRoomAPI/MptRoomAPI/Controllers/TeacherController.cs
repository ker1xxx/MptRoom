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
    public class TeacherController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<TeacherController> _logger;

        public TeacherController(MptRoomDbContext context, ILogger<TeacherController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Teacher
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<TeacherDTO>>> GetTeachers()
        {
            try
            {
                var teachers = await _context.Teachers
                    .Select(a => new TeacherDTO
                    {
                        UserId = a.UserId,
                        PersonalDataId = a.PersonalDataId,
                        AuthorizationDataId = a.AuthorizationDataId
                    })
                    .ToListAsync();

                return Ok(teachers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving teachers.");
                return StatusCode(500, "An error occurred while retrieving teachers.");
            }
        }

        // GET: api/Teacher/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<TeacherDTO>> GetTeacherModel(int id)
        {
            try
            {
                var teacher = await _context.Teachers
                    .Where(a => a.UserId == id)
                    .Select(a => new TeacherDTO
                    {
                        UserId = a.UserId,
                        PersonalDataId = a.PersonalDataId,
                        AuthorizationDataId = a.AuthorizationDataId
                    })
                    .FirstOrDefaultAsync();

                if (teacher == null)
                {
                    return NotFound($"Teacher with ID {id} not found.");
                }

                return Ok(teacher);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving teacher with ID {id}.");
                return StatusCode(500, "An error occurred while retrieving the teacher.");
            }
        }

        // PUT: api/Teacher/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutTeacherModel(int id, TeacherDTO teacherDTO)
        {
            if (id != teacherDTO.UserId)
            {
                return BadRequest("Teacher ID mismatch.");
            }

            try
            {
                var teacher = await _context.Teachers.FindAsync(id);

                if (teacher == null)
                {
                    return NotFound($"Teacher with ID {id} not found.");
                }

                teacher.PersonalDataId = teacherDTO.PersonalDataId;
                teacher.AuthorizationDataId = teacherDTO.AuthorizationDataId;

                _context.Entry(teacher).State = EntityState.Modified;

                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating teacher.");
                return StatusCode(500, "An error occurred while updating the teacher.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating teacher.");
                return StatusCode(500, "An error occurred while updating the teacher.");
            }
        }

        // POST: api/Teacher
        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<TeacherDTO>> PostTeacherModel(TeacherDTO teacherDTO)
        {
            try
            {
                var teacher = new TeacherModel
                {
                    PersonalDataId = teacherDTO.PersonalDataId,
                    AuthorizationDataId = teacherDTO.AuthorizationDataId
                };

                _context.Teachers.Add(teacher);
                await _context.SaveChangesAsync();

                teacherDTO.UserId = teacher.UserId;

                return CreatedAtAction(nameof(GetTeacherModel), new { id = teacherDTO.UserId }, teacherDTO);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error while creating teacher.");
                return StatusCode(500, "An error occurred while creating the teacher.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating teacher.");
                return StatusCode(500, "An error occurred while creating the teacher.");
            }
        }

        // DELETE: api/Teacher/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteTeacherModel(int id)
        {
            try
            {
                var teacherModel = await _context.Teachers.FindAsync(id);

                if (teacherModel == null)
                {
                    return NotFound($"Teacher with ID {id} not found.");
                }

                _context.Teachers.Remove(teacherModel);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error while deleting teacher with ID {id}.");
                return StatusCode(500, "An error occurred while deleting the teacher.");
            }
        }

        private bool TeacherModelExists(int id)
        {
            return _context.Teachers.Any(e => e.UserId == id);
        }
    }
}
