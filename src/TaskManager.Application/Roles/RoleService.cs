using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Common.Exceptions;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Roles.Dtos;
using TaskManager.Domain.Entities;

namespace TaskManager.Application.Roles;

public class RoleService : IRoleService
{
    private readonly IApplicationDbContext _db;

    public RoleService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<RoleDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var roles = await _db.Roles
            .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission).ThenInclude(p => p.Module)
            .OrderBy(r => r.Name)
            .ToListAsync(cancellationToken);

        return roles.Select(ToDto).ToList();
    }

    public async Task<RoleDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var role = await FindRoleAsync(id, cancellationToken);
        return ToDto(role);
    }

    public async Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken cancellationToken = default)
    {
        var nameTaken = await _db.Roles.AnyAsync(r => r.Name == request.Name, cancellationToken);
        if (nameTaken)
        {
            throw new ConflictException($"Ya existe un rol con el nombre \"{request.Name}\".");
        }

        var role = new Role
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim()
        };

        if (request.PermissionIds is { Count: > 0 })
        {
            await AttachPermissionsAsync(role, request.PermissionIds, cancellationToken);
        }

        _db.Roles.Add(role);
        await _db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(role.Id, cancellationToken);
    }

    public async Task<RoleDto> UpdateAsync(Guid id, UpdateRoleRequest request, CancellationToken cancellationToken = default)
    {
        var role = await FindRoleAsync(id, cancellationToken);

        var nameTaken = await _db.Roles.AnyAsync(r => r.Name == request.Name && r.Id != id, cancellationToken);
        if (nameTaken)
        {
            throw new ConflictException($"Ya existe un rol con el nombre \"{request.Name}\".");
        }

        role.Name = request.Name.Trim();
        role.Description = request.Description?.Trim();
        role.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return ToDto(role);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var role = await FindRoleAsync(id, cancellationToken);
        _db.Roles.Remove(role);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<RoleDto> AssignPermissionsAsync(Guid id, AssignPermissionsRequest request, CancellationToken cancellationToken = default)
    {
        var role = await FindRoleAsync(id, cancellationToken);

        role.RolePermissions.Clear();
        await AttachPermissionsAsync(role, request.PermissionIds, cancellationToken);
        role.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(id, cancellationToken);
    }

    private async Task AttachPermissionsAsync(Role role, List<Guid> permissionIds, CancellationToken cancellationToken)
    {
        var distinctIds = permissionIds.Distinct().ToList();
        var permissions = await _db.Permissions.Where(p => distinctIds.Contains(p.Id)).ToListAsync(cancellationToken);

        var missingIds = distinctIds.Except(permissions.Select(p => p.Id)).ToList();
        if (missingIds.Count > 0)
        {
            throw new NotFoundException($"No se encontraron los permisos: {string.Join(", ", missingIds)}.");
        }

        foreach (var permission in permissions)
        {
            role.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id });
        }
    }

    private async Task<Role> FindRoleAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _db.Roles
            .Include(r => r.RolePermissions).ThenInclude(rp => rp.Permission).ThenInclude(p => p.Module)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken)
            ?? throw new NotFoundException(nameof(Role), id);
    }

    private static RoleDto ToDto(Role role)
    {
        var permissionCodes = role.RolePermissions.Select(rp => rp.Permission.Code).Distinct().ToList();
        return new RoleDto(role.Id, role.Name, role.Description, permissionCodes);
    }
}
