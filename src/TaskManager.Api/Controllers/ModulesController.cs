using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Authorization;
using TaskManager.Application.Modules;
using TaskManager.Application.Modules.Dtos;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/modules")]
[Authorize]
public class ModulesController : ControllerBase
{
    private readonly IModuleService _moduleService;

    public ModulesController(IModuleService moduleService)
    {
        _moduleService = moduleService;
    }

    [HttpGet]
    [HasPermission("Modules", "Read")]
    public async Task<ActionResult<IReadOnlyCollection<ModuleDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _moduleService.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Modules", "Read")]
    public async Task<ActionResult<ModuleDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _moduleService.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [HasPermission("Modules", "Create")]
    public async Task<ActionResult<ModuleDto>> Create(CreateModuleRequest request, CancellationToken cancellationToken)
    {
        var module = await _moduleService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = module.Id }, module);
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Modules", "Edit")]
    public async Task<ActionResult<ModuleDto>> Update(Guid id, UpdateModuleRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _moduleService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Modules", "Delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _moduleService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
