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
    public class GroupController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<GroupController> _logger;

        public GroupController(MptRoomDbContext context, ILogger<GroupController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<GroupDTO>>> GetGroups()
        {
            try
            {
                var groups = await _context.Groups
                    .Select(g => new GroupDTO
                    {
                        GroupId = g.GroupId,
                        GroupName = g.GroupName,
                        CourseNumber = g.CourseNumber,
                    })
                    .ToListAsync();
                return Ok(groups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving groups");
                return StatusCode(500, "An error occurred while retrieving groups.");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<GroupDTO>> GetGroupModel(int id)
        {
            try
            {
                var group = await _context.Groups
                    .Where(g => g.GroupId == id)
                    .Select(g => new GroupDTO
                    {
                        GroupId = g.GroupId,
                        GroupName = g.GroupName,
                        CourseNumber = g.CourseNumber,
                    })
                    .FirstOrDefaultAsync();

                if (group == null)
                {
                    return NotFound($"Group with ID {id} not found.");
                }

                return Ok(group);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving group with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the group.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> PutGroupModel(int id, GroupDTO groupDTO)
        {
            if (id != groupDTO.GroupId)
            {
                return BadRequest("Group ID mismatch.");
            }

            try
            {
                var group = await _context.Groups.FindAsync(id);
                if (group == null)
                {
                    return NotFound($"Group with ID {id} not found.");
                }

                group.GroupName = groupDTO.GroupName;
                group.CourseNumber = groupDTO.CourseNumber;

                _context.Entry(group).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating group");
                return StatusCode(500, "An error occurred while updating the group.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating group");
                return StatusCode(500, "An error occurred while updating the group.");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Administrator")]
        public async Task<ActionResult<GroupDTO>> PostGroupModel(GroupDTO groupDTO)
        {
            try
            {
                var group = new GroupModel
                {
                    GroupName = groupDTO.GroupName,
                    CourseNumber = groupDTO.CourseNumber,
                };

                _context.Groups.Add(group);
                await _context.SaveChangesAsync();

                groupDTO.GroupId = group.GroupId;
                return CreatedAtAction(nameof(GetGroupModel), new { id = groupDTO.GroupId }, groupDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating group");
                return StatusCode(500, "An error occurred while creating the group.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteGroupModel(int id)
        {
            try
            {
                var group = await _context.Groups.FindAsync(id);
                if (group == null)
                {
                    return NotFound($"Group with ID {id} not found.");
                }

                _context.Groups.Remove(group);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting group");
                return StatusCode(500, "An error occurred while deleting the group.");
            }
        }

        private bool GroupModelExists(int id)
        {
            return _context.Groups.Any(e => e.GroupId == id);
        }
    }
}
