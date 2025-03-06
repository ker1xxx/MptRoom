using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MptRoomAPI.DTO;
using MptRoomAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MptRoomAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdditionalMaterialController : ControllerBase
    {
        private readonly MptRoomDbContext _context;
        private readonly ILogger<AdditionalMaterialController> _logger;

        public AdditionalMaterialController(MptRoomDbContext context, ILogger<AdditionalMaterialController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AdditionalMaterialDTO>>> GetAdditionalMaterials()
        {
            try
            {
                var materials = await _context.AdditionalMaterials
                    .Select(m => new AdditionalMaterialDTO
                    {
                        AdditionalMaterialId = m.AdditionalMaterialId,
                        UriAbsolutePath = m.UriAbsolutePath,
                        UserId = m.UserId,
                    })
                    .ToListAsync();
                return Ok(materials);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении дополнительных материалов.");
                return StatusCode(500, "Внутренняя ошибка сервера.");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<AdditionalMaterialDTO>> GetAdditionalMaterialModel(int id)
        {
            if (id <= 0)
                return BadRequest("Некорректный ID.");

            try
            {
                var material = await _context.AdditionalMaterials
                    .Where(m => m.AdditionalMaterialId == id)
                    .Select(m => new AdditionalMaterialDTO
                    {
                        AdditionalMaterialId = m.AdditionalMaterialId,
                        UriAbsolutePath = m.UriAbsolutePath,
                        UserId = m.UserId,
                    })
                    .FirstOrDefaultAsync();

                if (material == null)
                    return NotFound("Материал не найден.");

                return Ok(material);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении дополнительного материала.");
                return StatusCode(500, "Внутренняя ошибка сервера.");
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> PutAdditionalMaterialModel(int id, AdditionalMaterialDTO materialDTO)
        {
            if (id <= 0 || id != materialDTO.AdditionalMaterialId)
                return BadRequest("Некорректный ID.");

            try
            {
                var material = await _context.AdditionalMaterials.FindAsync(id);
                if (material == null)
                    return NotFound("Материал не найден.");

                material.UriAbsolutePath = materialDTO.UriAbsolutePath;
                material.UserId = materialDTO.UserId;

                _context.Entry(material).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении дополнительного материала.");
                return StatusCode(500, "Ошибка сервера при обновлении материала.");
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<AdditionalMaterialModel>> PostAdditionalMaterialModel(AdditionalMaterialDTO materialDTO)
        {
            if (string.IsNullOrWhiteSpace(materialDTO.UriAbsolutePath))
                return BadRequest("Ссылка на материал обязательна.");

            try
            {
                var material = new AdditionalMaterialModel
                {
                    UriAbsolutePath = materialDTO.UriAbsolutePath,
                    UserId = materialDTO.UserId,
                };

                _context.AdditionalMaterials.Add(material);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetAdditionalMaterialModel), new { id = material.AdditionalMaterialId }, material);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при добавлении дополнительного материала.");
                return StatusCode(500, "Ошибка сервера при создании материала.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteAdditionalMaterialModel(int id)
        {
            if (id <= 0)
                return BadRequest("Некорректный ID.");

            try
            {
                var material = await _context.AdditionalMaterials.FindAsync(id);
                if (material == null)
                    return NotFound("Материал не найден.");

                _context.AdditionalMaterials.Remove(material);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении дополнительного материала.");
                return StatusCode(500, "Ошибка сервера при удалении материала.");
            }
        }
    }
}
