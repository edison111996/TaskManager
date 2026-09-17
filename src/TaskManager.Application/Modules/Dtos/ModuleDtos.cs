using System.ComponentModel.DataAnnotations;

namespace TaskManager.Application.Modules.Dtos;

public record PermissionDto(Guid Id, string Action, string Code);

public record ModuleDto(
    Guid Id,
    string Name,
    string Code,
    string? Description,
    IReadOnlyCollection<PermissionDto> Permissions);

public record CreateModuleRequest(
    [Required] string Name,
    [Required] string Code,
    string? Description);

public record UpdateModuleRequest(
    [Required] string Name,
    string? Description);
