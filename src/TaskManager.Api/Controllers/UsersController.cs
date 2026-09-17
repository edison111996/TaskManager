using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Authorization;
using TaskManager.Application.Users;
using TaskManager.Application.Users.Dtos;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    [HasPermission("Users", "Read")]
    public async Task<ActionResult<IReadOnlyCollection<UserDto>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _userService.GetAllAsync(cancellationToken));
    }

    [HttpGet("lookup")]
    public async Task<ActionResult<IReadOnlyCollection<UserLookupDto>>> GetAssignable(CancellationToken cancellationToken)
    {
        // Sin [HasPermission]: cualquier usuario autenticado puede pedir esta lista mínima
        // (solo id/nombre/correo de usuarios activos) para elegir a quién asignar algo,
        // sin necesitar el permiso Users:Read de administración completa.
        return Ok(await _userService.GetAssignableAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [HasPermission("Users", "Read")]
    public async Task<ActionResult<UserDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await _userService.GetByIdAsync(id, cancellationToken));
    }

    [HttpPost]
    [HasPermission("Users", "Create")]
    public async Task<ActionResult<UserDto>> Create(CreateUserRequest request, CancellationToken cancellationToken)
    {
        var user = await _userService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id:guid}")]
    [HasPermission("Users", "Edit")]
    public async Task<ActionResult<UserDto>> Update(Guid id, UpdateUserRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _userService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission("Users", "Delete")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await _userService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}/roles")]
    [HasPermission("Users", "Edit")]
    public async Task<ActionResult<UserDto>> AssignRoles(Guid id, AssignRolesRequest request, CancellationToken cancellationToken)
    {
        return Ok(await _userService.AssignRolesAsync(id, request, cancellationToken));
    }
}
