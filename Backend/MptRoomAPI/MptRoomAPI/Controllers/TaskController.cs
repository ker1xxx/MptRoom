using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Build.Framework;
using Microsoft.CodeAnalysis.CSharp;
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
                    .Include(t => t.Post)
                    .Include(t => t.Student)
                    .OrderByDescending(t => t.LastUpdate)
                    .ToListAsync();

                if (tasks == null)
                    return NotFound();

                var dtos = tasks.Select(ToDTO).ToList();
                var updatedDtos = await CheckDeadline(dtos);
                return Ok(updatedDtos);
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
                    .Include(t => t.Post)
                    .Include(t => t.Student)
                    .FirstOrDefaultAsync(t => t.TaskId == id);

                if (task == null)
                    return NotFound();

                var taskDto = ToDTO(task);
                var updatedDtos = await CheckDeadline(new List<TaskDTO>() { taskDto });

                return Ok(updatedDtos.First());
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
                    .Include(t => t.Post)
                    .Include(t => t.Student)
                    .Where(t => t.StudentId == userId)
                    .OrderByDescending(t => t.LastUpdate)
                    .ToListAsync();

                if (tasks == null)
                    return NotFound();

                var dtos = tasks.Select(ToDTO).ToList();
                var updatedDtos = await CheckDeadline(dtos);
                return Ok(updatedDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks.");
                return StatusCode(500, "An error occurred while retrieving tasks.");
            }
        }
        [HttpGet("post/{postId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<TaskDTO>>> GetTasksByPostId(int postId)
        {
            try
            {
                var tasks = await _context.Tasks
                    .Include(t => t.Post)
                    .Include(t => t.Student)
                    .Where(t => t.PostId == postId)
                    .OrderByDescending(t => t.LastUpdate)
                    .ToListAsync();

                if (tasks == null)
                    return NotFound();


                var dtos = tasks.Select(ToDTO).ToList();
                var updatedDtos = await CheckDeadline(dtos);
                return Ok(updatedDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks.");
                return StatusCode(500, "An error occurred while retrieving tasks.");
            }
        }


        // PUT: api/Task/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutTaskModel(int id, TaskDTO taskDTO)
        {
            if (id != taskDTO.TaskId)
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
                task.TaskId = taskDTO.TaskId;
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

                return Ok();
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

                taskDTO.TaskId = task.TaskId;

                return CreatedAtAction(nameof(GetTaskModel), new { id = taskDTO.TaskId }, taskDTO);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error while creating task.");
                if (TaskModelExists((int)taskDTO.TaskId))
                {
                    return Conflict($"Task with ID {taskDTO.TaskId} already exists.");
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

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting task.");
                return StatusCode(500, "An error occurred while deleting the task.");
            }
        }

        private async Task<List<TaskDTO>> CheckDeadline(List<TaskDTO> taskDtos)
        {
            var now = DateTime.UtcNow;

            var updatedTaskIds = new List<int>();
            foreach (var dto in taskDtos)
            {
                if (dto.DueTime < now && dto.TaskStatus == TaskStatusEnum.Appointed)
                {
                    var taskModel = await _context.Tasks.FindAsync(dto.TaskId);
                    if (taskModel != null)
                    {
                        taskModel.TaskStatusEnum = TaskStatusEnum.DeadlineMissed;
                        _context.Entry(taskModel).State = EntityState.Modified;
                        updatedTaskIds.Add((int)taskModel.TaskId);
                    }
                    dto.TaskStatus = TaskStatusEnum.DeadlineMissed;
                }
            }

            if (updatedTaskIds.Count > 0)
                await _context.SaveChangesAsync();

            return taskDtos;
        }

        public static TaskDTO ToDTO(TaskModel model)
        {
            return new TaskDTO
            {
                TaskId = model.TaskId,
                PostId = model.PostId,
                DueTime = model.DueTime,
                SubjectId = model.SubjectId,
                TeacherId = model.TeacherId,
                CourseId = model.CourseId,
                TaskStatus = model.TaskStatusEnum,
                StudentId = model.StudentId,
                MaxMark = model.MaxMark,
                Mark = model.Mark,
                LastUpdate = model.LastUpdate,
            };
        }

        public static TaskModel ToModel(TaskDTO taskDTO)
        {
            return new TaskModel
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
        }

        private bool TaskModelExists(int id)
        {
            return _context.Tasks.Any(e => e.PostId == id);
        }
    }
}
