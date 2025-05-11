using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Extensions;
using MptRoomAPI.DTO;
using MptRoomAPI.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
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
                        PostId = m.PostId
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

        [HttpGet("task/{taskId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AdditionalMaterialDTO>>> GetAdditionalMaterialsByTaskId(int taskId)
        {
            try
            {
                var currentTask = await _context.Tasks
                    .FirstAsync(t => t.TaskId == taskId);

                var materials = await _context.AdditionalMaterials
                    .Where(m => m.UserId == currentTask.StudentId && m.PostId == currentTask.PostId)
                    .Select(m => new AdditionalMaterialDTO
                    {
                        AdditionalMaterialId = m.AdditionalMaterialId,
                        UriAbsolutePath = m.UriAbsolutePath,
                        UserId = m.UserId,
                        PostId = m.PostId
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
        [HttpGet("post/{postId}")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<AdditionalMaterialDTO>>> GetAdditionalMaterialsByPostId(int postId)
        {
            try
            {
                var materials = await _context.Posts
                    .Where(p => p.PostId == postId)
                    .Include(p => p.Materials)
                    .SelectMany(p => p.Materials)
                    .Select(m => new AdditionalMaterialDTO
                    {
                        AdditionalMaterialId = m.AdditionalMaterialId,
                        UriAbsolutePath = m.UriAbsolutePath,
                        UserId = m.UserId,
                        PostId = m.PostId
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

        [HttpGet("file/{id}")]
        [Authorize]
        public async Task<IActionResult> GetAdditionalMaterialFileUrl(int id)
        {
            try
            {
                var file = await _context.AdditionalMaterials.FirstAsync(am => am.AdditionalMaterialId == id);

                if (!System.IO.File.Exists(file.UriAbsolutePath))
                    return NotFound();

                // Здесь формируем публичную ссылку на файл
                var fileName = Path.GetFileName(file.UriAbsolutePath);

                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                var publicFileUrl = $"{baseUrl}/uploads/{fileName}";

                return Ok(publicFileUrl); // Возвращаем просто СТРОКУ (URL)
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении ссылки на файл.");
                return StatusCode(500, "Внутренняя ошибка сервера.");
            }
        }

        [HttpGet("upload/{id}")]
        [Authorize]
        public async Task<IActionResult> GetUploadedFile(int id)
        {

            try
            {
                var file = await _context.AdditionalMaterials.FirstOrDefaultAsync(am => am.AdditionalMaterialId == id);
                if (file == null)
                    return NotFound("Файл не найден в базе данных.");

                if (!System.IO.File.Exists(file.UriAbsolutePath))
                    return NotFound("Физический файл не найден на диске.");

                var fileBytes = await System.IO.File.ReadAllBytesAsync(file.UriAbsolutePath);
                var contentType = GetContentType(file.UriAbsolutePath); // определяем тип контента

                var fileName = Path.GetFileName(file.UriAbsolutePath);

                return File(fileBytes, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении файла с ID {FileId}", id);
                return StatusCode(500, "Ошибка сервера при получении файла.");
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
                        PostId = m.PostId
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

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении дополнительного материала.");
                return StatusCode(500, "Ошибка сервера при обновлении материала.");
            }
        }

        [HttpPost]
        [Authorize]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<ActionResult<AdditionalMaterialModel>> PostAdditionalMaterialModel([FromForm] IFormFile file,
            [FromForm] string userId,
            [FromForm] string courseId,
            [FromForm] string groupId,
            [FromForm] string subjectId,
            [FromForm] string postId)
        {
            try
            {
                if (file == null || file.Length == 0)
                    return BadRequest("Файл пустой");

                // Получаем пользователя по userId из базы данных
                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == Convert.ToInt32(userId));
                if (user == null)
                    return NotFound("Пользователь не найден");

                // Получаем данные о курсе, группе и предмете, если они существуют
                GroupModel group = await _context.Groups.FirstAsync(g => g.GroupId == Convert.ToInt32(groupId));
                CourseModel course = await _context.Courses.FirstAsync(c => c.CourseId == Convert.ToInt32(courseId));
                SubjectModel subject = await _context.Subjects.FirstAsync(s => s.SubjectId == Convert.ToInt32(subjectId));
                string studentName = string.Empty;
                string directory;
                string courseNumber = group.CourseNumber.GetDisplayName();


                if (user is StudentModel student)
                {
                    var personalData = await _context.PersonalDatas.FirstAsync(pd => pd.PersonalDataId == student.PersonalDataId);
                    studentName = personalData.Lastname + personalData.Name[0] + personalData.Patronymic?[0];

                    directory = Path.Combine("D:\\mptroomfiles", courseNumber, ToLatin(group.GroupName), ToLatin(subject.SubjectName), ToLatin(studentName));
                }
                else
                {
                    directory = Path.Combine("D:\\mptroomfiles", courseNumber, ToLatin(group.GroupName), ToLatin(subject.SubjectName));
                }

                // Создаем директорию, если её нет
                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                var filePath = Path.Combine(directory, file.FileName);

                // Сохраняем файл
                using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }

                var material = new AdditionalMaterialModel
                {
                    UriAbsolutePath = filePath,
                    UserId = Convert.ToInt32(userId),
                    PostId = Convert.ToInt32(postId)
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

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при удалении дополнительного материала.");
                return StatusCode(500, "Ошибка сервера при удалении материала.");
            }
        }

        private string ToLatin(string input)
        {
            var cyrillic = new Dictionary<char, string>
    {
        {'А', "A"}, {'Б', "B"}, {'В', "V"}, {'Г', "G"}, {'Д', "D"}, {'Е', "E"}, {'Ё', "Yo"}, {'Ж', "Zh"},
        {'З', "Z"}, {'И', "I"}, {'Й', "Y"}, {'К', "K"}, {'Л', "L"}, {'М', "M"}, {'Н', "N"}, {'О', "O"},
        {'П', "P"}, {'Р', "R"}, {'С', "S"}, {'Т', "T"}, {'У', "U"}, {'Ф', "F"}, {'Х', "Kh"}, {'Ц', "Ts"},
        {'Ч', "Ch"}, {'Ш', "Sh"}, {'Щ', "Shch"}, {'Ы', "Y"}, {'Э', "E"}, {'Ю', "Yu"}, {'Я', "Ya"},
        {'а', "a"}, {'б', "b"}, {'в', "v"}, {'г', "g"}, {'д', "d"}, {'е', "e"}, {'ё', "yo"}, {'ж', "zh"},
        {'з', "z"}, {'и', "i"}, {'й', "y"}, {'к', "k"}, {'л', "l"}, {'м', "m"}, {'н', "n"}, {'о', "o"},
        {'п', "p"}, {'р', "r"}, {'с', "s"}, {'т', "t"}, {'у', "u"}, {'ф', "f"}, {'х', "kh"}, {'ц', "ts"},
        {'ч', "ch"}, {'ш', "sh"}, {'щ', "shch"}, {'ы', "y"}, {'э', "e"}, {'ю', "yu"}, {'я', "ya"}
    };

            var result = new StringBuilder();
            foreach (var c in input)
            {
                if (cyrillic.ContainsKey(c))
                    result.Append(cyrillic[c]);
                else if (c == ' ')
                    result.Append("_");
                else
                    result.Append(c);
            }

            return result.ToString();
        }

        private string GetContentType(string path)
        {
            var provider = new FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(path, out var contentType))
            {
                contentType = "application/octet-stream"; // если не определили — ставим дефолт
            }
            return contentType;
        }
    }
}
