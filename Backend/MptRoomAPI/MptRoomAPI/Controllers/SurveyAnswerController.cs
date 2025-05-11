using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MptRoomAPI.DTO;
using MptRoomAPI.Models;

namespace MptRoomAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SurveyAnswerController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<SurveyAnswerController> _logger;

        public SurveyAnswerController(MptRoomDbContext context, ILogger<SurveyAnswerController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/SurveyAnswer
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<SurveyAnswerDTO>>> GetSurveyAnswers()
        {
            try
            {
                var surveyAnswers = await _context.SurveyAnswers
                    .Select(sa => new SurveyAnswerDTO
                    {
                        SurveyAnswerId = sa.SurveyAnswerId,
                        StudentId = sa.StudentId,
                        PostId = sa.PostId,
                        SurveyOptionId = sa.SurveyOptionId,
                        CommitTime = sa.CommitTime
                    })
                    .ToListAsync();
                return Ok(surveyAnswers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving survey options");
                return StatusCode(500, "An error occurred while retrieving survey options.");
            }
        }
        [HttpGet("post/{post_id}/student/{student_id}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<SurveyAnswerDTO>>> GetSurveyAnswersByStudentId(int post_id, int student_id)
        {
            try
            {
                var surveyAnswers = await _context.SurveyAnswers
                    .Where(sa => sa.PostId == post_id && sa.StudentId == student_id)
                    .Select(sa => new SurveyAnswerDTO
                    {
                        SurveyAnswerId = sa.SurveyAnswerId,
                        StudentId = sa.StudentId,
                        PostId = sa.PostId,
                        SurveyOptionId = sa.SurveyOptionId,
                        CommitTime = sa.CommitTime
                    })
                    .ToListAsync();
                return Ok(surveyAnswers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving survey options");
                return StatusCode(500, "An error occurred while retrieving survey options.");
            }
        }

        [HttpGet("post/{postId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<SurveyAnswerDTO>>> GetSurveyAnswersByPost(int postId)
        {
            try
            {
                var surveyAnswers = await _context.SurveyAnswers
                    .Where(sa => sa.PostId == postId)
                    .Select(sa => new SurveyAnswerDTO
                    {
                        SurveyAnswerId = sa.SurveyAnswerId,
                        StudentId = sa.StudentId,
                        PostId = sa.PostId,
                        SurveyOptionId = sa.SurveyOptionId,
                        CommitTime = sa.CommitTime
                    })
                    .ToListAsync();
                return Ok(surveyAnswers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving survey options");
                return StatusCode(500, "An error occurred while retrieving survey options.");
            }
        }

        // GET: api/SurveyAnswer/5
        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<SurveyAnswerDTO>> GetSurveyAnswerModel(int id)
        {
            try
            {
                var surveyAnswers = await _context.SurveyAnswers
                    .Where(a => a.StudentId == id)
                    .Select(sa => new SurveyAnswerDTO
                    {
                        SurveyAnswerId = sa.SurveyAnswerId,
                        StudentId = sa.StudentId,
                        PostId = sa.PostId,
                        SurveyOptionId = sa.SurveyOptionId,
                        CommitTime = sa.CommitTime
                    }).FirstOrDefaultAsync();

                if (surveyAnswers == null)
                {
                    return NotFound($"Survey Answer with ID {id} not found.");
                }

                return Ok(surveyAnswers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving Survey Answer with ID {id}");
                return StatusCode(500, "An error occurred while retrieving the Survey Answer.");
            }
        }

        // PUT: api/SurveyAnswer/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> PutSurveyAnswerModel(int id, SurveyAnswerDTO surveyAnswerDTO)
        {
            if (id != surveyAnswerDTO.SurveyAnswerId)
            {
                return BadRequest("Survey Answer ID mismatch.");
            }

            try
            {
                var surveyAnswer = await _context.SurveyAnswers.FindAsync(id);
                if (surveyAnswer == null)
                {
                    return NotFound($"Survey Answer with ID {id} not found.");
                }
                surveyAnswer.SurveyOptionId = surveyAnswerDTO.SurveyOptionId;
                surveyAnswer.CommitTime = DateTime.UtcNow;

                _context.Entry(surveyAnswer).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error while updating Survey Answer");
                return StatusCode(500, "An error occurred while updating the Survey Answer.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while updating Survey Answer");
                return StatusCode(500, "An error occurred while updating the Survey Answer.");
            }
        }

        // POST: api/SurveyAnswer
        [HttpPost]
        [Authorize(Roles = "Student")]
        public async Task<ActionResult<SurveyAnswerDTO>> PostSurveyAnswerModel(SurveyAnswerDTO surveyAnswerDTO)
        {
            try
            {
                var surveyAnswer = new SurveyAnswerModel
                {
                    StudentId = surveyAnswerDTO.StudentId,
                    PostId = surveyAnswerDTO.PostId,
                    SurveyOptionId = surveyAnswerDTO.SurveyOptionId,
                    CommitTime = surveyAnswerDTO.CommitTime
                };

                _context.SurveyAnswers.Add(surveyAnswer);
                await _context.SaveChangesAsync();

                surveyAnswerDTO.SurveyAnswerId = surveyAnswer.SurveyAnswerId;
                return CreatedAtAction(nameof(GetSurveyAnswerModel), new { id = surveyAnswerDTO.SurveyAnswerId}, surveyAnswerDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating Survey Answer");
                return StatusCode(500, "An error occurred while creating the Survey Answer.");
            }
        }

        // DELETE: api/SurveyAnswer/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> DeleteSurveyAnswerModel(int id)
        {
            try
            {
                var surveyAnswer = await _context.SurveyAnswers.FindAsync(id);
                if (surveyAnswer == null)
                {
                    return NotFound($"Survey Answer with ID {id} not found.");
                }

                _context.SurveyAnswers.Remove(surveyAnswer);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting Survey Answer");
                return StatusCode(500, "An error occurred while deleting the Survey Answer.");
            }
        }

        private bool SurveyAnswerModelExists(int id)
        {
            return _context.SurveyAnswers.Any(sa => sa.SurveyAnswerId == id);
        }
    }
}
