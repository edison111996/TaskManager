using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using TaskManager.Application.Auth.Dtos;
using TaskManager.Application.Common.Exceptions;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Common.Options;
using TaskManager.Domain.Entities;

namespace TaskManager.Application.Auth;

public class AuthService : IAuthService
{
    private const string DefaultRoleName = "User";

    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        IApplicationDbContext db,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        IOptions<JwtSettings> jwtSettings)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailTaken = await _db.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (emailTaken)
        {
            throw new ConflictException($"Ya existe un usuario con el correo \"{request.Email}\".");
        }

        var defaultRole = await _db.Roles.FirstOrDefaultAsync(r => r.Name == DefaultRoleName, cancellationToken)
            ?? throw new NotFoundException($"No se encontró el rol por defecto \"{DefaultRoleName}\". Verifique el seed de datos.");

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.Hash(request.Password),
            IsActive = true
        };
        user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = defaultRole.Id });

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        return await BuildAuthResponseAsync(user.Id, cancellationToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (user is null || !user.IsActive || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAppException("Correo o contraseña inválidos.");
        }

        return await BuildAuthResponseAsync(user.Id, cancellationToken);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var existingToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken);

        if (existingToken is null || !existingToken.IsActive)
        {
            throw new UnauthorizedAppException("El refresh token es inválido o expiró.");
        }

        existingToken.RevokedAt = DateTime.UtcNow;

        var response = await BuildAuthResponseAsync(existingToken.UserId, cancellationToken);
        existingToken.ReplacedByToken = response.RefreshToken;

        await _db.SaveChangesAsync(cancellationToken);

        return response;
    }

    public async Task RevokeTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var existingToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, cancellationToken);

        if (existingToken is null || !existingToken.IsActive)
        {
            throw new NotFoundException("El refresh token no existe o ya no está activo.");
        }

        existingToken.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<MeResponse> GetMeAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role).ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission).ThenInclude(p => p.Module)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException(nameof(User), userId);

        var roleNames = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var permissionCodes = GetPermissionCodes(user);

        return new MeResponse(user.Id, user.FirstName, user.LastName, user.Email, roleNames, permissionCodes);
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role).ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission).ThenInclude(p => p.Module)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException(nameof(User), userId);

        var roleNames = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        var permissionCodes = GetPermissionCodes(user);

        var accessToken = _jwtTokenGenerator.GenerateAccessToken(user, permissionCodes, roleNames);
        var refreshTokenValue = _jwtTokenGenerator.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays)
        };
        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync(cancellationToken);

        var userSummary = new UserSummaryDto(user.Id, user.FirstName, user.LastName, user.Email, roleNames);

        return new AuthResponse(
            accessToken.Token,
            accessToken.ExpiresAt,
            refreshToken.Token,
            refreshToken.ExpiresAt,
            userSummary);
    }

    private static List<string> GetPermissionCodes(User user)
    {
        return user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToList();
    }
}
