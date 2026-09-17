using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Common.Exceptions;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Users.Dtos;
using TaskManager.Domain.Entities;

namespace TaskManager.Application.Users;

public class UserService : IUserService
{
    private readonly IApplicationDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public UserService(IApplicationDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task<IReadOnlyCollection<UserDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var users = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .OrderBy(u => u.Email)
            .ToListAsync(cancellationToken);

        return users.Select(ToDto).ToList();
    }

    public async Task<UserDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await FindUserAsync(id, cancellationToken);
        return ToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailTaken = await _db.Users.AnyAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (emailTaken)
        {
            throw new ConflictException($"Ya existe un usuario con el correo \"{request.Email}\".");
        }

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Phone = request.Phone?.Trim(),
            IsActive = true
        };

        if (request.RoleIds is { Count: > 0 })
        {
            await AttachRolesAsync(user, request.RoleIds, cancellationToken);
        }

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(user.Id, cancellationToken);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default)
    {
        var user = await FindUserAsync(id, cancellationToken);
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var emailTaken = await _db.Users.AnyAsync(u => u.Email == normalizedEmail && u.Id != id, cancellationToken);
        if (emailTaken)
        {
            throw new ConflictException($"Ya existe un usuario con el correo \"{request.Email}\".");
        }

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Email = normalizedEmail;
        user.Phone = request.Phone?.Trim();
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return ToDto(user);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await FindUserAsync(id, cancellationToken);
        _db.Users.Remove(user);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<UserDto> AssignRolesAsync(Guid id, AssignRolesRequest request, CancellationToken cancellationToken = default)
    {
        var user = await FindUserAsync(id, cancellationToken);

        user.UserRoles.Clear();
        await AttachRolesAsync(user, request.RoleIds, cancellationToken);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<UserLookupDto>> GetAssignableAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Users
            .Where(u => u.IsActive)
            .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
            .Select(u => new UserLookupDto(u.Id, u.FirstName, u.LastName, u.Email))
            .ToListAsync(cancellationToken);
    }

    private async Task AttachRolesAsync(User user, List<Guid> roleIds, CancellationToken cancellationToken)
    {
        var distinctRoleIds = roleIds.Distinct().ToList();
        var roles = await _db.Roles.Where(r => distinctRoleIds.Contains(r.Id)).ToListAsync(cancellationToken);

        var missingIds = distinctRoleIds.Except(roles.Select(r => r.Id)).ToList();
        if (missingIds.Count > 0)
        {
            throw new NotFoundException($"No se encontraron los roles: {string.Join(", ", missingIds)}.");
        }

        foreach (var role in roles)
        {
            user.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
        }
    }

    private async Task<User> FindUserAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken)
            ?? throw new NotFoundException(nameof(User), id);
    }

    private static UserDto ToDto(User user)
    {
        var roleNames = user.UserRoles.Select(ur => ur.Role.Name).Distinct().ToList();
        return new UserDto(user.Id, user.FirstName, user.LastName, user.Email, user.Phone, user.IsActive, roleNames);
    }
}
