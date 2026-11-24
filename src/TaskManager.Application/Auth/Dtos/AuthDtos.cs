using System.ComponentModel.DataAnnotations;

namespace TaskManager.Application.Auth.Dtos;

public record RegisterRequest(
    [Required] string FirstName,
    [Required] string LastName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(8), RegularExpression(@"^(?=.*[A-Z])(?=.*\d).+$", ErrorMessage = "La contraseña debe tener al menos una mayúscula y un número.")] string Password);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record RefreshTokenRequest([Required] string RefreshToken);

public record RevokeTokenRequest([Required] string RefreshToken);

public record UserSummaryDto(Guid Id, string FirstName, string LastName, string Email, IReadOnlyCollection<string> Roles);

public record AuthResponse(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    string RefreshToken,
    DateTime RefreshTokenExpiresAt,
    UserSummaryDto User);

public record MeResponse(
    Guid Id,
    string FirstName,
    string LastName,
    string Email,
    IReadOnlyCollection<string> Roles,
    IReadOnlyCollection<string> Permissions);
