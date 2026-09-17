using TaskManager.Application.Users.Dtos;

namespace TaskManager.Application.Users;

public interface IUserService
{
    Task<IReadOnlyCollection<UserDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<UserDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserDto> AssignRolesAsync(Guid id, AssignRolesRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<UserLookupDto>> GetAssignableAsync(CancellationToken cancellationToken = default);
}
