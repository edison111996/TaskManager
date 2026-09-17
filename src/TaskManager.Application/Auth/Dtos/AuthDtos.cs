using System.ComponentModel.DataAnnotations;

namespace TaskManager.Application.Auth.Dtos;

public record RegisterRequest(
    [Required] string FirstName,
    [Required] string LastName,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password);

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
