using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Authorization;
using TaskManager.Application.Roles;
using TaskManager.Application.Roles.Dtos;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;

    public RolesController(IRoleService roleService)
    {
        _roleService = roleService;
    }

    [HttpGet]
    [HasPermission("Roles", "Read")]
    public async Task<ActionResult<IReadOnlyCollection<RoleDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _roleService.GetAllAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Roles", "Read")]
    public async Task<ActionResult<RoleDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _roleService.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [HasPermission("Roles", "Create")]
    public async Task<ActionResult<RoleDto>> Create(CreateRoleRequest request, CancellationToken cancellationToken)
    {
        var role = await _roleService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = role.Id }, role);
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Roles", "Edit")]
    public async Task<ActionResult<RoleDto>> Update(Guid id, UpdateRoleRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _roleService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Roles", "Delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _roleService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}/permissions")]
    [HasPermission("Roles", "Edit")]
    public async Task<ActionResult<RoleDto>> AssignPermissions(Guid id, AssignPermissionsRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _roleService.AssignPermissionsAsync(id, request, cancellationToken));
    }
}
