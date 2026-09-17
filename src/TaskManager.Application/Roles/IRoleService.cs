using TaskManager.Application.Roles.Dtos;

namespace TaskManager.Application.Roles;

public interface IRoleService
{
    Task<IReadOnlyCollection<RoleDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<RoleDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RoleDto> CreateAsync(CreateRoleRequest request, CancellationToken cancellationToken = default);
    Task<RoleDto> UpdateAsync(Guid id, UpdateRoleRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<RoleDto> AssignPermissionsAsync(Guid id, AssignPermissionsRequest request, CancellationToken cancellationToken = default);
}
