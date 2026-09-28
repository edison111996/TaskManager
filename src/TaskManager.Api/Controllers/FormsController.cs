using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Authorization;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Forms;
using TaskManager.Application.Forms.Dtos;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/forms")]
[Authorize]
public class FormsController : ControllerBase
{
    private static readonly HashSet<string> AllowedUploadExtensions =
        [".jpg", ".jpeg", ".png", ".gif", ".webp", ".pdf", ".doc", ".docx", ".xls", ".xlsx"];
    private const long MaxUploadBytes = 5 * 1024 * 1024; // 5 MB

    private readonly IFormService _formService;
    private readonly IFileStorageService _fileStorageService;

    public FormsController(IFormService formService, IFileStorageService fileStorageService)
    {
        _formService = formService;
        _fileStorageService = fileStorageService;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    // ---- Constructor (admin, permiso Forms:*) ----

    [HttpGet]
    [HasPermission("Forms", "Read")]
    public async Task<ActionResult<IReadOnlyCollection<FormTemplateDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _formService.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Forms", "Read")]
    public async Task<ActionResult<FormTemplateDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _formService.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [HasPermission("Forms", "Create")]
    public async Task<ActionResult<FormTemplateDto>> Create(CreateFormTemplateRequest request, CancellationToken cancellationToken)
    {
        var form = await _formService.CreateAsync(CurrentUserId, request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = form.Id }, form);
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Forms", "Edit")]
    public async Task<ActionResult<FormTemplateDto>> Update(Guid id, UpdateFormTemplateRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _formService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpPatch("{id:guid}/publish")]
    [HasPermission("Forms", "Edit")]
    public async Task<ActionResult<FormTemplateDto>> SetPublished(Guid id, [FromBody] bool isPublished, CancellationToken cancellationToken)
    {
        return Ok(await _formService.SetPublishedAsync(id, isPublished, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Forms", "Delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _formService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpGet("{id:guid}/submissions")]
    [HasPermission("Forms", "Read")]
    public async Task<ActionResult<IReadOnlyCollection<FormSubmissionDto>>> GetSubmissions(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _formService.GetSubmissionsAsync(id, cancellationToken));
    }

    // ---- Diligenciar (cualquier usuario autenticado, sin permiso Forms) ----

    [HttpGet("published")]
    public async Task<ActionResult<IReadOnlyCollection<FormTemplateDto>>> GetPublished(CancellationToken cancellationToken)
    {
        return Ok(await _formService.GetPublishedAsync(cancellationToken));
    }

    [HttpGet("{id:guid}/fill")]
    public async Task<ActionResult<FormTemplateDetailDto>> GetForFill(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _formService.GetForFillAsync(id, cancellationToken));
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, SubmitFormRequest request, CancellationToken cancellationToken)
    {
        await _formService.SubmitAsync(id, CurrentUserId, request, cancellationToken);
        return NoContent();
    }

    [HttpPost("uploads")]
    [RequestSizeLimit(MaxUploadBytes)]
    public async Task<ActionResult<object>> Upload(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return BadRequest(new { message = "El archivo está vacío." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedUploadExtensions.Contains(extension))
        {
            return BadRequest(new { message = $"Tipo de archivo no permitido: \"{extension}\"." });
        }

        await using var stream = file.OpenReadStream();
        var path = await _fileStorageService.SaveAsync(stream, file.FileName, cancellationToken);

        return Ok(new { path });
    }
}
