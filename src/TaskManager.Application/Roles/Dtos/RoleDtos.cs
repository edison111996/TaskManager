using System.ComponentModel.DataAnnotations;

namespace TaskManager.Application.Roles.Dtos;

public record RoleDto(
    Guid Id,
    string Name,
    string? Description,
    IReadOnlyCollection<string> Permissions);

public record CreateRoleRequest(
    [Required] string Name,
    string? Description,
    List<Guid>? PermissionIds);

public record UpdateRoleRequest(
    [Required] string Name,
    string? Description);

public record AssignPermissionsRequest([Required] List<Guid> PermissionIds);
