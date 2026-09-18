using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Authorization;
using TaskManager.Application.Projects;
using TaskManager.Application.Projects.Dtos;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    // La administración de proyectos reutiliza los permisos de Tasks (Create/Edit/Delete/Read)
    // en vez de tener su propio Module — quien puede gestionar tareas gestiona sus proyectos.
    [HttpGet]
    [HasPermission("Tasks", "Read")]
    public async Task<ActionResult<IReadOnlyCollection<ProjectDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _projectService.GetAllAsync(cancellationToken));
    }

    [HttpGet("lookup")]
    public async Task<ActionResult<IReadOnlyCollection<ProjectLookupDto>>> GetActive(CancellationToken cancellationToken)
    {
        // Sin [HasPermission]: cualquier usuario autenticado que pueda crear/editar una tarea
        // necesita esta lista mínima para el selector "Proyecto" (mismo criterio que
        // UsersController.GetAssignable para el selector de "asignado a").
        return Ok(await _projectService.GetActiveAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Tasks", "Read")]
    public async Task<ActionResult<ProjectDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _projectService.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [HasPermission("Tasks", "Create")]
    public async Task<ActionResult<ProjectDto>> Create(CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var project = await _projectService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = project.Id }, project);
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Tasks", "Edit")]
    public async Task<ActionResult<ProjectDto>> Update(Guid id, UpdateProjectRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _projectService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Tasks", "Delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _projectService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
