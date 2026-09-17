using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Authorization;
using TaskManager.Application.Tasks;
using TaskManager.Application.Tasks.Dtos;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    private Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);

    [HttpGet]
    [HasPermission("Tasks", "Read")]
    public async Task<ActionResult<IReadOnlyCollection<TaskItemDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _taskService.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Tasks", "Read")]
    public async Task<ActionResult<TaskItemDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _taskService.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [HasPermission("Tasks", "Create")]
    public async Task<ActionResult<TaskItemDto>> Create(CreateTaskRequest request, CancellationToken cancellationToken)
    {
        var task = await _taskService.CreateAsync(CurrentUserId, request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = task.Id }, task);
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Tasks", "Edit")]
    public async Task<ActionResult<TaskItemDto>> Update(Guid id, UpdateTaskRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _taskService.UpdateAsync(id, CurrentUserId, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Tasks", "Delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _taskService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/comments")]
    [HasPermission("Tasks", "Edit")]
    public async Task<ActionResult<TaskItemDetailDto>> AddComment(Guid id, AddCommentRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _taskService.AddCommentAsync(id, CurrentUserId, request, cancellationToken));
    }
}
