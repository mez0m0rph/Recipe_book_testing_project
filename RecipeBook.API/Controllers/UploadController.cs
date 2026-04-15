using Microsoft.AspNetCore.Mvc;

namespace RecipeBook.API.Controllers;

[ApiController]
[Route("api/uploads")]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;

    public UploadController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpPost]
    [RequestSizeLimit(50_000_000)]
    public async Task<IActionResult> Upload([FromForm] List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new { message = "Файлы не переданы." });
        }

        if (files.Count > 5)
        {
            return BadRequest(new { message = "Можно загрузить не более 5 файлов за раз." });
        }

        var uploadsPath = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");

        if (!Directory.Exists(uploadsPath))
        {
            Directory.CreateDirectory(uploadsPath);
        }

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var result = new List<string>();

        foreach (var file in files)
        {
            if (file.Length == 0)
            {
                continue;
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = $"Недопустимый тип файла: {file.FileName}" });
            }

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            await using var stream = System.IO.File.Create(filePath);
            await file.CopyToAsync(stream);

            var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
            result.Add(fileUrl);
        }

        return Ok(result);
    }
}