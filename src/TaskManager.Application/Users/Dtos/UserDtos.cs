using System.ComponentModel.DataAnnotations;

namespace TaskManager.Application.Users.Dtos;

public record UserDto(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    bool IsActive,
    IReadOnlyCollection<string> Roles);

/// <summary>
/// Versión mínima de usuario para selectores (ej. "asignar a") — cualquier usuario
/// autenticado puede pedirla, no requiere el permiso Users:Read.
/// </summary>
public record UserLookupDto(Guid Id, string FirstName, string LastName, string Email);

public record CreateUserRequest(
    [Required] string FirstName,
    [Required] string LastName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Phone] string? Phone,
    List<Guid>? RoleIds);

public record UpdateUserRequest(
    [Required] string FirstName,
    [Required] string LastName,
    [Required, EmailAddress] string Email,
    [Phone] string? Phone,
    bool IsActive);

public record AssignRolesRequest([Required] List<Guid> RoleIds);
