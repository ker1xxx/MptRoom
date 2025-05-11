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
using MptRoomAPI.Models.Enums;

namespace MptRoomAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TaskAnswerController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<TaskAnswerController> _logger;

        public TaskAnswerController(MptRoomDbContext context, ILogger<TaskAnswerController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/TaskAnswer
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<TaskAnswerDTO>>> GetTaskAnswers()
        {
            try
            {
                var taskAnswers = await _context.TaskAnswers
                    .Select(ta => new TaskAnswerDTO
                    {
                        TaskAnswerId = ta.TaskAnswerId, // Assuming TaskAnswerId is needed
                        AdditionalMaterialId = ta.AdditionalMaterialId,
                        StudentId = ta.StudentId,
                        TaskId = ta.TaskId,
                        AssignmentTime = ta.AssignmentTime,
                    })
                    .ToListAsync();

                return Ok(taskAnswers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task answers.");
                return StatusCode(500, "An error occurred while retrieving task answers.");
            }
        }

        // GET: api/TaskAnswer/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<TaskAnswerDTO>> GetTaskAnswerModel(int id)
        {
            try
            {
                var taskAnswer = await _context.TaskAnswers
                    .Where(ta => ta.TaskAnswerId == id)
                    .Select(ta => new TaskAnswerDTO
                    {
                        TaskAnswerId = ta.TaskAnswerId, // Assuming TaskAnswerId is needed
                        AdditionalMaterialId = ta.AdditionalMaterialId,
                        StudentId = ta.StudentId,
                        TaskId = ta.TaskId,
                        AssignmentTime = ta.AssignmentTime,
                    })
                    .FirstOrDefaultAsync();

                if (taskAnswer == null)
                {
                    return NotFound($"Task answer with ID {id} not found.");
                }

                return Ok(taskAnswer);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving task answer with ID {id}.");
                return StatusCode(500, "An error occurred while retrieving the task answer.");
            }
        }

        [HttpGet("teacher/assigned/{id}")]
        [Authorize(Roles = "Teacher")]
        public async Task<ActionResult<IEnumerable<TaskAnswerDTO>>> GetAssignedTaskAnswersByTeacher(int id)
        {
            try
            {
                var postIds = await _context.Tasks
                 .Include(t => t.Teacher)
                 .Where(t =>
                     t.Teacher.UserId == id &&
                     t.TaskStatusEnum == TaskStatusEnum.Submitted)
                 .Select(t => t.PostId)
                 .Distinct()
                 .ToListAsync();

                var taskAnswers = await _context.TaskAnswers
                    .Where(ta => postIds.Contains(ta.TaskId))
                    .Select(ta => new TaskAnswerDTO
                    {
                        TaskAnswerId = ta.TaskAnswerId,
                        AdditionalMaterialId = ta.AdditionalMaterialId,
                        StudentId = ta.StudentId,
                        TaskId = ta.TaskId,
                        AssignmentTime = ta.AssignmentTime,
                    })
                    .ToListAsync();

                return Ok(taskAnswers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task answers.");
                return StatusCode(500, "An error occurred while retrieving task answers.");
            }
        }

        [HttpGet("post/{post_id}")]
        [Authorize(Roles = "Teacher")]
        public async Task<ActionResult<IEnumerable<TaskAnswerDTO>>> GetTaskAnswersByPost(int post_id)
        {
            try
            {
                var taskAnswers = await _context.TaskAnswers
                    .Include(ta => ta.Task)
                    .Where(t=>t.Task.PostId == post_id)
                    .Select(ta => new TaskAnswerDTO
                    {
                        TaskAnswerId = ta.TaskAnswerId,
                        AdditionalMaterialId = ta.AdditionalMaterialId,
                        StudentId = ta.StudentId,
                        TaskId = ta.TaskId,
                        AssignmentTime = ta.AssignmentTime,
                    })
                    .ToListAsync();

                return Ok(taskAnswers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task answers.");
                return StatusCode(500, "An error occurred while retrieving task answers.");
            }
        }

        // PUT: api/TaskAnswer/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutTaskAnswerModel(int id, TaskAnswerDTO taskAnswerDTO)
        {
            if (id != taskAnswerDTO.TaskAnswerId)
            {
                return BadRequest("Task answer ID mismatch.");
            }

            try
            {
                var taskAnswer = await _context.TaskAnswers.FindAsync(id);

                if (taskAnswer == null)
                {
                    return NotFound($"Task answer with ID {id} not found.");
                }

                taskAnswer.AdditionalMaterialId = taskAnswerDTO.AdditionalMaterialId;
                taskAnswer.StudentId = taskAnswerDTO.StudentId;
                taskAnswer.TaskId = taskAnswerDTO.TaskId;

                _context.Entry(taskAnswer).State = EntityState.Modified;

                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating task answer.");
                return StatusCode(500, "An error occurred while updating the task answer.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating task answer.");
                return StatusCode(500, "An error occurred while updating the task answer.");
            }
        }

        // POST: api/TaskAnswer
        [HttpPost]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<TaskAnswerDTO>> PostTaskAnswerModel(TaskAnswerDTO taskAnswerDTO)
        {
            try
            {
                var taskAnswer = new TaskAnswerModel
                {
                    AdditionalMaterialId = taskAnswerDTO.AdditionalMaterialId,
                    StudentId = taskAnswerDTO.StudentId,
                    TaskId = taskAnswerDTO.TaskId,
                    AssignmentTime = DateTime.UtcNow,
                };

                _context.TaskAnswers.Add(taskAnswer);
                await _context.SaveChangesAsync();

                taskAnswerDTO.TaskAnswerId = taskAnswer.TaskAnswerId;

                return CreatedAtAction(nameof(GetTaskAnswerModel), new { id = taskAnswerDTO.TaskAnswerId }, taskAnswerDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating task answer.");
                return StatusCode(500, "An error occurred while creating the task answer.");
            }
        }

        [HttpPost("upload-file")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> UploadTaskFile(
            IFormFile file,
            [FromForm] string course,
            [FromForm] string group,
            [FromForm] string subject,
            [FromForm] string student,
            [FromForm] int studentId,
            [FromForm] int postId
)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл не выбран.");

            try
            {
                // Строим путь
                var basePath = Path.Combine("D:\\mptroomfiles", course, group, subject, student);
                Directory.CreateDirectory(basePath);

                var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(basePath, fileName);

                // Сохраняем файл
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Сохраняем запись в AdditionalMaterial
                var material = new AdditionalMaterialModel
                {
                    UriAbsolutePath = filePath,
                    UserId = studentId // если studentId == userId
                };
                _context.Add(material);
                await _context.SaveChangesAsync();

                // Создаем TaskAnswer
                var taskAnswer = new TaskAnswerModel
                {
                    AdditionalMaterialId = (int)material.AdditionalMaterialId,
                    StudentId = studentId,
                    TaskId = postId,
                    AssignmentTime = DateTime.Now
                };
                _context.Add(taskAnswer);
                await _context.SaveChangesAsync();

                return Ok(material);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Внутренняя ошибка: {ex.Message}");
            }
        }

        // DELETE: api/TaskAnswer/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteTaskAnswerModel(int id)
        {
            try
            {
                var taskAnswer = await _context.TaskAnswers.FindAsync(id);
                if (taskAnswer == null)
                {
                    return NotFound($"Task answer with ID {id} not found.");
                }

                _context.TaskAnswers.Remove(taskAnswer);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting task answer.");
                return StatusCode(500, "An error occurred while deleting the task answer.");
            }
        }

        private bool TaskAnswerModelExists(int id)
        {
            return _context.TaskAnswers.Any(e => e.TaskAnswerId == id);
        }
    }
}
