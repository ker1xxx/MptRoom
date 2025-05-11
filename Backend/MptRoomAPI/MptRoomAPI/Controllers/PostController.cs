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
    public class PostController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<PostController> _logger;

        public PostController(MptRoomDbContext context, ILogger<PostController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PostDTO>>> GetPosts()
        {
            try
            {
                var posts = await _context.Posts
                    .Select(p => new PostDTO
                    {
                        PostId = p.PostId,
                        PostTitle = p.PostTitle,
                        PostDescription = p.PostDescription,
                        PostType = p.PostType,
                        PostThemeId = p.PostThemeId,
                        CourseId = p.CourseId,
                        UserId = p.UserId,
                        Created = p.Created
                    })
                    .OrderByDescending(p => p.Created)
                    .ToListAsync();

                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving posts");
                return StatusCode(500, "An error occurred while retrieving posts.");
            }
        }

        [HttpGet("course/{course_id}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<PostDTO>>> GetPostsByCourse(int course_id)
        {
            try
            {
                var posts = await _context.Posts
                    .Where(p => p.CourseId == course_id)
                    .Select(p => new PostDTO
                    {
                        PostId = p.PostId,
                        PostTitle = p.PostTitle,
                        PostDescription = p.PostDescription,
                        PostType = p.PostType,
                        PostThemeId = p.PostThemeId,
                        CourseId = p.CourseId,
                        UserId = p.UserId,
                        Created = p.Created
                    })
                    .OrderByDescending(p => p.Created)
                    .ToListAsync();

                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving posts");
                return StatusCode(500, "An error occurred while retrieving posts.");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<PostDTO>> GetPostModel(int id)
        {
            try
            {
                var post = await _context.Posts
                    .Where(p => p.PostId == id)
                    .Select(p => new PostDTO
                    {
                        PostId = p.PostId,
                        PostTitle = p.PostTitle,
                        PostDescription = p.PostDescription,
                        PostType = p.PostType,
                        PostThemeId = p.PostThemeId,
                        CourseId = p.CourseId,
                        UserId = p.UserId,
                        Created = p.Created
                    })
                    .FirstOrDefaultAsync();

                if (post == null)
                {
                    return NotFound($"Post with ID {id} not found.");
                }

                return Ok(post);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving post with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the post.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator,Teacher")]
        public async Task<IActionResult> PutPostModel(int id, PostDTO postDTO)
        {
            if (id != postDTO.PostId)
            {
                return BadRequest("Post ID mismatch.");
            }

            try
            {
                var post = await _context.Posts.FindAsync(id);
                if (post == null)
                {
                    return NotFound($"Post with ID {id} not found.");
                }

                post.PostTitle = postDTO.PostTitle;
                post.PostDescription = postDTO.PostDescription;
                post.PostType = postDTO.PostType;
                post.PostThemeId = postDTO.PostThemeId;
                post.CourseId = postDTO.CourseId;
                post.UserId = postDTO.UserId;
                post.Created = postDTO.Created;

                _context.Entry(post).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating post");
                return StatusCode(500, "An error occurred while updating the post.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating post");
                return StatusCode(500, "An error occurred while updating the post.");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Administrator,Teacher")]
        public async Task<ActionResult<PostDTO>> PostPostModel(PostDTO postDTO)
        {
            try
            {
                var post = new PostModel
                {
                    PostTitle = postDTO.PostTitle,
                    PostDescription = postDTO.PostDescription,
                    PostType = postDTO.PostType,
                    PostThemeId = postDTO.PostThemeId,
                    CourseId = postDTO.CourseId,
                    UserId = postDTO.UserId,
                    Created = postDTO.Created   
                };

                _context.Posts.Add(post);
                await _context.SaveChangesAsync();

                postDTO.PostId = post.PostId;

                return CreatedAtAction(nameof(GetPostModel), new { id = postDTO.PostId }, postDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating post");
                return StatusCode(500, "An error occurred while creating the post.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator,Teacher")]
        public async Task<IActionResult> DeletePostModel(int id)
        {
            try
            {
                var post = await _context.Posts.FindAsync(id);
                if (post == null)
                {
                    return NotFound($"Post with ID {id} not found.");
                }

                _context.Posts.Remove(post);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting post");
                return StatusCode(500, "An error occurred while deleting the post.");
            }
        }

        private bool PostModelExists(int id)
        {
            return _context.Posts.Any(e => e.PostId == id);
        }
    }
}
