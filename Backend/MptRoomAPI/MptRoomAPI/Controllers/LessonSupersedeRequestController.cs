using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Azure.Core;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.CodeAnalysis;
using Microsoft.EntityFrameworkCore;
using MptRoomAPI.DTO;
using MptRoomAPI.Models;

namespace MptRoomAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LessonSupersedeRequestController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<LessonSupersedeRequestController> _logger;

        public LessonSupersedeRequestController(MptRoomDbContext context, ILogger<LessonSupersedeRequestController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/LessonSupersedeRequest
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<LessonSupersedeRequestDTO>>> GetLessonSupersedeRequests()
        {
            try
            {
                var requests = await _context.LessonSupressedRequests
                    .Select(lsr => new LessonSupersedeRequestDTO
                    {
                        SupersedeRequestId = lsr.SupersedeRequestId,
                        TeacherId = lsr.TeacherId,
                        GroupId = lsr.GroupId,
                        DateToSupersede = lsr.DateToSupersede,
                        LessonSlotId = lsr.LessonSlotId,
                        SubjectId = lsr.SubjectId,
                        RequestTime = lsr.RequestTime,
                        AffectedLessonId = lsr.AffectedLessonId,
                        SupersedeRequestStatus = lsr.SupersedeRequestStatus,
                        SupersedeRequestType = lsr.SupersedeRequestType
                    }).ToListAsync();

                var validRequests = await ClearExpiredRequests(requests);

                return Ok(validRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Lesson Supersede Requests");
                return StatusCode(500, "An error occurred while retrieving Lesson Supersede Requests.");
            }
        }

        // GET: api/LessonSupersedeRequest/5
        [HttpGet("{id}")]
        [Authorize(Roles = "Administrator, Teacher")]
        public async Task<ActionResult<LessonSupersedeRequestDTO>> GetLessonSupersedeRequestModel(int id)
        {
            try
            {
                var request = await _context.LessonSupressedRequests
                    .Where(lsr => lsr.SupersedeRequestId == id)
                    .Select(lsr => new LessonSupersedeRequestDTO
                    {
                        SupersedeRequestId = lsr.SupersedeRequestId,
                        TeacherId = lsr.TeacherId,
                        GroupId= lsr.GroupId,
                        DateToSupersede = lsr.DateToSupersede,
                        LessonSlotId = lsr.LessonSlotId,
                        SubjectId = lsr.SubjectId,
                        RequestTime = lsr.RequestTime,
                        AffectedLessonId = lsr.AffectedLessonId,
                        SupersedeRequestStatus = lsr.SupersedeRequestStatus,
                        SupersedeRequestType = lsr.SupersedeRequestType
                    }).FirstOrDefaultAsync();


                if (request == null)
                {
                    return NotFound($"Lesson supersede request with ID {id} not found.");
                }
                var validRequests = await ClearExpiredRequests(new List<LessonSupersedeRequestDTO>() { request });


                return Ok(validRequests.First());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Lesson Supersede Request");
                return StatusCode(500, "An error occurred while retrieving Lesson Supersede Request.");
            }
        }

        [HttpGet("group/{GroupId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<LessonSupersedeRequestDTO>>> GetLessonSupersedeRequestModelByGroupId(int GroupId)
        {
            try
            {
                var requests = await _context.LessonSupressedRequests
                    .Where(lsr => lsr.GroupId == GroupId)
                    .Select(lsr => new LessonSupersedeRequestDTO
                    {
                        SupersedeRequestId = lsr.SupersedeRequestId,
                        TeacherId = lsr.TeacherId,
                        GroupId = lsr.GroupId,
                        DateToSupersede = lsr.DateToSupersede,
                        LessonSlotId = lsr.LessonSlotId,
                        SubjectId = lsr.SubjectId,
                        RequestTime = lsr.RequestTime,
                        AffectedLessonId = lsr.AffectedLessonId,
                        SupersedeRequestStatus = lsr.SupersedeRequestStatus,
                        SupersedeRequestType = lsr.SupersedeRequestType
                    }).ToListAsync();

                if (requests == null)
                {
                    return NotFound($"Lesson supersede request with group ID {GroupId} not found.");
                }

                var validRequests = await ClearExpiredRequests(requests);

                return Ok(validRequests);

            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Lesson Supersede Request");
                return StatusCode(500, "An error occurred while retrieving Lesson Supersede Request.");
            }
        }

        [HttpGet("teacher/{TeacherId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<LessonSupersedeRequestDTO>>> GetLessonSupersedeRequestModelByTeacherId(int TeacherId)
        {
            try
            {
                var requests = await _context.LessonSupressedRequests
                    .Where(lsr => lsr.TeacherId == TeacherId)
                    .Select(lsr => new LessonSupersedeRequestDTO
                    {
                        SupersedeRequestId = lsr.SupersedeRequestId,
                        TeacherId = lsr.TeacherId,
                        GroupId = lsr.GroupId,
                        DateToSupersede = lsr.DateToSupersede,
                        LessonSlotId = lsr.LessonSlotId,
                        SubjectId = lsr.SubjectId,
                        RequestTime = lsr.RequestTime,
                        AffectedLessonId = lsr.AffectedLessonId,
                        SupersedeRequestStatus = lsr.SupersedeRequestStatus,
                        SupersedeRequestType = lsr.SupersedeRequestType
                    }).ToListAsync();

                if (requests == null)
                {
                    return NotFound($"Lesson supersede request with teacher ID {TeacherId} not found.");
                }

                var validRequests = await ClearExpiredRequests(requests);

                return Ok(validRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving Lesson Supersede Request");
                return StatusCode(500, "An error occurred while retrieving Lesson Supersede Request.");
            }
        }

        // PUT: api/LessonSupersedeRequest/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Teacher, Administrator")]
        public async Task<IActionResult> PutLessonSupersedeRequest(int id, LessonSupersedeRequestDTO lessonSupersedeRequestDTO)
        {
            if (id != lessonSupersedeRequestDTO.SupersedeRequestId)
            {
                return BadRequest("Supersede ID mismatch.");
            }
            try
            {
                var request = await _context.LessonSupressedRequests.FindAsync(id);
                if (request == null)
                    return NotFound($"Lesson Supersede Request with ID {id} not found.");

                request.SupersedeRequestId = lessonSupersedeRequestDTO.SupersedeRequestId;
                  request. TeacherId = lessonSupersedeRequestDTO.TeacherId;
                        request.GroupId = lessonSupersedeRequestDTO.GroupId;
                        request.DateToSupersede = lessonSupersedeRequestDTO.DateToSupersede;
                        request.LessonSlotId = lessonSupersedeRequestDTO.LessonSlotId;
                        request.SubjectId = lessonSupersedeRequestDTO.SubjectId;
                        request.RequestTime = lessonSupersedeRequestDTO.RequestTime;
                request.AffectedLessonId = lessonSupersedeRequestDTO.AffectedLessonId;
                request.SupersedeRequestStatus = lessonSupersedeRequestDTO.SupersedeRequestStatus;
                request.SupersedeRequestType = lessonSupersedeRequestDTO.SupersedeRequestType;

               _context.Entry(request).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while updating Lesson Supersede Request");
                return StatusCode(500, "An error occurred while updating Lesson Supersede Request.");
            }
        }
        //POST: api/LessonSupersedeRequest
        [HttpPost]
        [Authorize(Roles = "Teacher, Administrator")]
        public async Task<ActionResult<LessonSupersedeRequestDTO>> PostLessonSupersedeRequest(LessonSupersedeRequestDTO lessonSupersedeRequestDTO)
        {
            try
            {
                var request = new LessonSupersedeRequestModel
                {
                    TeacherId = lessonSupersedeRequestDTO.TeacherId,
                    GroupId = lessonSupersedeRequestDTO.GroupId,
                    DateToSupersede = lessonSupersedeRequestDTO.DateToSupersede,
                    LessonSlotId = lessonSupersedeRequestDTO.LessonSlotId,
                    SubjectId = lessonSupersedeRequestDTO.SubjectId,
                    RequestTime = lessonSupersedeRequestDTO.RequestTime,
                    AffectedLessonId = lessonSupersedeRequestDTO.AffectedLessonId,
                    SupersedeRequestStatus = lessonSupersedeRequestDTO.SupersedeRequestStatus,
                    SupersedeRequestType = lessonSupersedeRequestDTO.SupersedeRequestType
                };
               
                _context.LessonSupressedRequests.Add(request);
                await _context.SaveChangesAsync();

                lessonSupersedeRequestDTO.SupersedeRequestId = request.SupersedeRequestId;
                return CreatedAtAction(nameof(GetLessonSupersedeRequestModel), new { id = lessonSupersedeRequestDTO.SupersedeRequestId }, lessonSupersedeRequestDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while creating Lesson Supersede Request");
                return StatusCode(500, "An error occurred while creating Lesson Supersede Request.");
            }
        }

        //DELETE: api/LessonSupersedeRequest/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Teacher, Administrator")]
        public async Task<IActionResult> DeleteLessonSupersedeRequest(int id)
        {
            try
            {
                var request = await _context.LessonSupressedRequests.FindAsync(id);
                if (request == null)
                    return NotFound($"Lesson Supersede Request with ID {id} not found.");

                _context.LessonSupressedRequests.Remove(request);
                await _context.SaveChangesAsync();

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while deleting Lesson Supersede Request");
                return StatusCode(500, "An error occurred while deleting Lesson Supersede Request.");
            }

        }
        private async Task<IEnumerable<LessonSupersedeRequestDTO>> ClearExpiredRequests(List<LessonSupersedeRequestDTO> requests)
        {
            DateTime yesterday = DateTime.UtcNow.AddDays(-1);
            var validRequestIds = new List<int>();

            foreach (var req in requests)
            {
                if (req.DateToSupersede < new DateOnly(yesterday.Year, yesterday.Month, yesterday.Day))
                {
                    var taskModel = await _context.Tasks.FindAsync(req.SupersedeRequestId);
                    await DeleteLessonSupersedeRequest((int)req.SupersedeRequestId);
                    validRequestIds.Add((int)req.SupersedeRequestId);
                }   
            }

            if (validRequestIds.Count > 0)
                await _context.SaveChangesAsync();

            return requests;
        }

        private bool LessonSupersedeRequestModelExists(int? id)
        {
            return _context.LessonSupressedRequests.Any(e => e.SupersedeRequestId == id);
        }
    }
}
