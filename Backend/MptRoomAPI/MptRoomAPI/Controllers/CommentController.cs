using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MptRoomAPI.DTO;
using MptRoomAPI.Models;

namespace MptRoomAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<CommentController> _logger;

        public CommentController(MptRoomDbContext context, ILogger<CommentController> logger)
        {
            _context = context;
            _logger = logger;
        }
        // GET: api/Comment
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<CommentDTO>>> GetComments()
        {
            try
            {
                var comments = await _context.Comments
                    .Select(c => new CommentDTO
                    {
                        CommentId = c.CommentId,
                        PostId = c.PostId,
                        CommentText = c.CommentText,
                        AuthorId = c.AuthorId,
                        Date = c.Date
                    }).ToListAsync();
                return Ok(comments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving comments");
                return StatusCode(500, "An error occured while retrieving comments");
            }
        }

        // GET: api/Comment/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<CommentDTO>> GetCommentModel(int id)
        {
            try
            {
                var comments = await _context.Comments
                    .Where(c => c.CommentId == id)
                    .Select(c => new CommentDTO
                    {
                        CommentId = c.CommentId,
                        PostId = c.PostId,
                        CommentText = c.CommentText,
                        AuthorId = c.AuthorId,
                        Date = c.Date
                    }).FirstOrDefaultAsync();

                return Ok(comments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving comments");
                return StatusCode(500, "An error occured while retrieving comments");
            }
        }

        // GET: api/Comment/5
        [HttpGet("post/{PostId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<CommentDTO>>> GetCommentModelByPostId(int PostId)
        {
            try
            {
                var comments = await _context.Comments
                    .Where(c => c.PostId == PostId)
                    .Select(c => new CommentDTO
                    {
                        CommentId = c.CommentId,
                        PostId = c.PostId,
                        CommentText = c.CommentText,
                        AuthorId = c.AuthorId,
                        Date = c.Date
                    }).ToListAsync();

                return Ok(comments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving comments");
                return StatusCode(500, "An error occured while retrieving comments");
            }
        }

        // GET: api/Comment/5
        [HttpGet("user/{UserId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<CommentDTO>>> GetCommentModelByUserId(int UserId)
        {
            try
            {
                var comments = await _context.Comments
                    .Where(c => c.AuthorId == UserId)
                    .Select(c => new CommentDTO
                    {
                        CommentId = c.CommentId,
                        PostId = c.PostId,
                        CommentText = c.CommentText,
                        AuthorId = c.AuthorId,
                        Date = c.Date
                    }).ToListAsync();
                return Ok(comments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving comments");
                return StatusCode(500, "An error occured while retrieving comments");
            }
        }

        // GET: api/Comment/5
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutCommentModel(int id, CommentDTO commentDTO)
        {
            if (id != commentDTO.CommentId)
            {
                return BadRequest("Comment ID mismatch");
            }
            try
            {
                var comment = await _context.Comments.FindAsync(id);

                if (comment == null)
                {
                    return NotFound($"Comment with ID {id} not found.");
                }

                comment.PostId = commentDTO.PostId;
                comment.CommentText = commentDTO.CommentText;
                comment.AuthorId = commentDTO.AuthorId;
                comment.Date = DateTime.UtcNow;

                _context.Entry(comment).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating comments");
                return StatusCode(500, "An error occured while updating comments");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while updating comments");
                return StatusCode(500, "An error occured while updating comments");
            }
        }

        // POST: CommentController/Create
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<CommentDTO>> PostCommentModel(CommentDTO commentDTO)
        {
            try
            {
                var comment = new CommentModel
                {
                    PostId = commentDTO.PostId,
                    CommentText = commentDTO.CommentText,
                    AuthorId = commentDTO.AuthorId,
                    Date = DateTime.UtcNow
                };;

                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                commentDTO.CommentId = comment.CommentId;
                return CreatedAtAction(nameof(GetCommentModel), new { id = commentDTO.CommentId }, commentDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating comments");
                return StatusCode(500, "An error occured while creating comments");
            }
        }

        // GET: api/Comment/Delete/5
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteCommentModel(int id)
        {
            try
            {
                var comment = await _context.Comments.FindAsync(id);

                if (comment == null)
                {
                    return NotFound($"Comment with ID {id} not found.");
                }

                _context.Comments.Remove(comment);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting comments");
                return StatusCode(500, "An error occured while deleting comments");
            }
        }
    }
}
