using TaskManager.Application.Tasks.Dtos;

namespace TaskManager.Application.Tasks;

public interface ITaskService
{
    Task<IReadOnlyCollection<TaskItemDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TaskItemDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TaskItemDto> CreateAsync(Guid createdByUserId, CreateTaskRequest request, CancellationToken cancellationToken = default);
    Task<TaskItemDto> UpdateAsync(Guid id, Guid changedByUserId, UpdateTaskRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TaskItemDetailDto> AddCommentAsync(Guid taskId, Guid authorUserId, AddCommentRequest request, CancellationToken cancellationToken = default);
}
