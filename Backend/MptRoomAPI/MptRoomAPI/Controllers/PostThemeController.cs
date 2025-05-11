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
    public class PostThemeController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<PostThemeController> _logger;

        public PostThemeController(MptRoomDbContext context, ILogger<PostThemeController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/PostTheme
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PostThemeDTO>>> GetPostThemes()
        {
            try
            {
                var postThemes = await _context.PostThemes
                    .Select(pt => new PostThemeDTO
                    {
                        PostThemeId = pt.PostThemeId,
                        PostThemeText = pt.PostThemeText,
                        CourseId = pt.CourseId
                    })
                    .ToListAsync();
                return Ok(postThemes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving post theme records");
                return StatusCode(500, "An error occurred while retrieving post theme records.");
            }
        }

        [HttpGet("course/{course_id}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PostThemeDTO>>> GetPostThemesByCourseId(int course_id)
        {
            try
            {
                var postThemes = await _context.PostThemes
                    .Where(pt => pt.CourseId == course_id)
                    .Select(pt => new PostThemeDTO
                    {
                        PostThemeId = pt.PostThemeId,
                        PostThemeText = pt.PostThemeText,
                        CourseId = pt.CourseId

                    })
                    .ToListAsync();
                return Ok(postThemes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving post theme records");
                return StatusCode(500, "An error occurred while retrieving post theme records.");
            }
        }

        // GET: api/PostTheme/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<PostThemeDTO>> GetPostThemeModel(int id)
        {
            try
            {
                var postTheme = await _context.PostThemes
                    .Where(pt => pt.PostThemeId == id)
                    .Select(pt => new PostThemeDTO
                    {
                        PostThemeId = pt.PostThemeId,
                        PostThemeText = pt.PostThemeText,
                        CourseId = pt.CourseId
                    })
                    .FirstOrDefaultAsync();

                if (postTheme == null)
                {
                    return NotFound($"Post theme with ID {id} not found.");
                }

                return Ok(postTheme);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving post theme with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the post theme record.");
            }
        }

        // PUT: api/PostTheme/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator,Teacher")]
        public async Task<IActionResult> PutPostThemeModel(int id, PostThemeDTO postThemeDTO)
        {
            if (id != postThemeDTO.PostThemeId)
            {
                return BadRequest("Post theme ID mismatch.");
            }

            try
            {
                var postTheme = await _context.PostThemes.FindAsync(id);
                if (postTheme == null)
                {
                    return NotFound($"Post theme with ID {id} not found.");
                }

                postTheme.PostThemeText = postThemeDTO.PostThemeText;

                _context.Entry(postTheme).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating post theme record");
                return StatusCode(500, "An error occurred while updating the post theme record.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating post theme record");
                return StatusCode(500, "An error occurred while updating the post theme record.");
            }
        }

        // POST: api/PostTheme
        [HttpPost]
        [Authorize(Roles = "Administrator,Teacher")]
        public async Task<ActionResult<PostThemeDTO>> PostPostThemeModel(PostThemeDTO postThemeDTO)
        {
            try
            {
                var postTheme = new PostThemeModel
                {
                    PostThemeText = postThemeDTO.PostThemeText,
                    CourseId = postThemeDTO.CourseId
                };

                _context.PostThemes.Add(postTheme);
                await _context.SaveChangesAsync();

                postThemeDTO.PostThemeId = postTheme.PostThemeId;

                return CreatedAtAction(nameof(GetPostThemeModel), new { id = postThemeDTO.PostThemeId }, postThemeDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating post theme record");
                return StatusCode(500, "An error occurred while creating the post theme record.");
            }
        }

        // DELETE: api/PostTheme/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator,Teacher")]
        public async Task<IActionResult> DeletePostThemeModel(int id)
        {
            try
            {
                var postTheme = await _context.PostThemes.FindAsync(id);
                if (postTheme == null)
                {
                    return NotFound($"Post theme with ID {id} not found.");
                }

                _context.PostThemes.Remove(postTheme);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting post theme record");
                return StatusCode(500, "An error occurred while deleting the post theme record.");
            }
        }

        private bool PostThemeModelExists(int id)
        {
            return _context.PostThemes.Any(e => e.PostThemeId == id);
        }
    }
}
