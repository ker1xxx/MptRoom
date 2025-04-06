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
    public class TaskController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<TaskController> _logger;

        public TaskController(MptRoomDbContext context, ILogger<TaskController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Task
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<TaskDTO>>> GetTasks()
        {
            try
            {
                var tasks = await _context.Tasks
                    .Select(t => new TaskDTO
                    {
                        PostId = t.PostId,
                        DueTime = t.DueTime,
                        SubjectId = t.SubjectId,
                        TeacherId = t.TeacherId,
                        CourseId = t.CourseId,
                        TaskStatus = t.TaskStatusEnum,
                        StudentId = t.StudentId,
                        MaxMark = t.MaxMark,
                        Mark = t.Mark,
                        LastUpdate = t.LastUpdate,
                    })
                    .ToListAsync();

                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks.");
                return StatusCode(500, "An error occurred while retrieving tasks.");
            }
        }

        // GET: api/Task/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<TaskDTO>> GetTaskModel(int id)
        {
            try
            {
                var task = await _context.Tasks
                    .Where(t => t.PostId == id)
                    .Select(t => new TaskDTO
                    {
                        PostId = t.PostId,
                        DueTime = t.DueTime,
                        SubjectId = t.SubjectId,
                        TeacherId = t.TeacherId,
                        CourseId = t.CourseId,
                        TaskStatus = t.TaskStatusEnum,
                        StudentId = t.StudentId,
                        MaxMark = t.MaxMark,
                        Mark = t.Mark,
                        LastUpdate = t.LastUpdate,
                    })
                    .FirstOrDefaultAsync();

                if (task == null)
                {
                    return NotFound($"Task with ID {id} not found.");
                }

                return Ok(task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving task with ID {id}.");
                return StatusCode(500, "An error occurred while retrieving the task.");
            }
        }

        [HttpGet("student/{userId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<TaskDTO>>> GetTasksByUser(int userId)
        {
            try
            {
                var tasks = await _context.Tasks
                    .Where(t => t.StudentId == userId)
                    .Select(t => new TaskDTO
                    {
                        PostId = t.PostId,
                        DueTime = t.DueTime,
                        SubjectId = t.SubjectId,
                        TeacherId = t.TeacherId,
                        CourseId = t.CourseId,
                        TaskStatus = t.TaskStatusEnum,
                        StudentId = t.StudentId,
                        MaxMark = t.MaxMark,
                        Mark = t.Mark,
                        LastUpdate = t.LastUpdate,
                    })
                    .ToListAsync();

                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks.");
                return StatusCode(500, "An error occurred while retrieving tasks.");
            }
        } 

        // PUT: api/Task/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator,Teacher")]
        public async Task<IActionResult> PutTaskModel(int id, TaskDTO taskDTO)
        {
            if (id != taskDTO.PostId)
            {
                return BadRequest("Task ID mismatch.");
            }

            try
            {
                var task = await _context.Tasks.FindAsync(id);

                if (task == null)
                {
                    return NotFound($"Task with ID {id} not found.");
                }

                task.DueTime = taskDTO.DueTime;
                task.SubjectId = taskDTO.SubjectId;
                task.TeacherId = taskDTO.TeacherId;
                task.CourseId = taskDTO.CourseId;
                task.TaskStatusEnum = taskDTO.TaskStatus;
                task.StudentId = taskDTO.StudentId;
                task.MaxMark = taskDTO.MaxMark;
                task.Mark = taskDTO.Mark;
                task.LastUpdate = taskDTO.LastUpdate;

                _context.Entry(task).State = EntityState.Modified;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating task.");
                return StatusCode(500, "An error occurred while updating the task.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating task.");
                return StatusCode(500, "An error occurred while updating the task.");
            }
        }

        // POST: api/Task
        [HttpPost]
        [Authorize(Roles = "Administrator,Teacher")]
        public async Task<ActionResult<TaskDTO>> PostTaskModel(TaskDTO taskDTO)
        {
            try
            {
                var task = new TaskModel
                {
                    PostId = taskDTO.PostId,
                    DueTime = taskDTO.DueTime,
                    SubjectId = taskDTO.SubjectId,
                    TeacherId = taskDTO.TeacherId,
                    CourseId = taskDTO.CourseId,
                    TaskStatusEnum = taskDTO.TaskStatus,
                    StudentId = taskDTO.StudentId,
                    MaxMark = taskDTO.MaxMark,
                    Mark = taskDTO.Mark,
                    LastUpdate = taskDTO.LastUpdate,
                };

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                taskDTO.PostId = task.PostId;

                return CreatedAtAction(nameof(GetTaskModel), new { id = taskDTO.PostId }, taskDTO);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error while creating task.");
                if (TaskModelExists((int)taskDTO.PostId))
                {
                    return Conflict($"Task with ID {taskDTO.PostId} already exists.");
                }
                return StatusCode(500, "An error occurred while creating the task.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while creating task.");
                return StatusCode(500, "An error occurred while creating the task.");
            }
        }

        // DELETE: api/Task/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator,Teacher")]
        public async Task<IActionResult> DeleteTaskModel(int id)
        {
            try
            {
                var taskModel = await _context.Tasks.FindAsync(id);
                if (taskModel == null)
                {
                    return NotFound($"Task with ID {id} not found.");
                }

                _context.Tasks.Remove(taskModel);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting task.");
                return StatusCode(500, "An error occurred while deleting the task.");
            }
        }

        private bool TaskModelExists(int id)
        {
            return _context.Tasks.Any(e => e.PostId == id);
        }
    }
}
