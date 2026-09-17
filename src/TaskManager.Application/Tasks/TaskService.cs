using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Common.Exceptions;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Tasks.Dtos;
using TaskManager.Domain.Entities;
using TaskManager.Domain.Enums;

namespace TaskManager.Application.Tasks;

public class TaskService : ITaskService
{
    private readonly IApplicationDbContext _db;

    public TaskService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<TaskItemDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var tasks = await _db.Tasks
            .Include(t => t.AssignedToUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.Comments)
            .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        return tasks.Select(ToDto).ToList();
    }

    public async Task<TaskItemDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await FindTaskAsync(id, cancellationToken);
        return ToDetailDto(task);
    }

    public async Task<TaskItemDto> CreateAsync(Guid createdByUserId, CreateTaskRequest request, CancellationToken cancellationToken = default)
    {
        var assignee = await _db.Users.FindAsync([request.AssignedToUserId], cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), request.AssignedToUserId);
        var creator = await _db.Users.FindAsync([createdByUserId], cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), createdByUserId);

        var task = new TaskItem
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartDate = request.StartDate,
            DueDate = request.DueDate,
            Status = TaskItemStatus.Pending,
            AssignedToUserId = assignee.Id,
            CreatedByUserId = creator.Id
        };

        _db.Tasks.Add(task);
        _db.TaskStatusHistories.Add(new TaskStatusHistory
        {
            TaskItemId = task.Id,
            FromStatus = null,
            ToStatus = task.Status,
            ChangedByUserId = creator.Id
        });

        await _db.SaveChangesAsync(cancellationToken);

        task.AssignedToUser = assignee;
        task.CreatedByUser = creator;
        return ToDto(task);
    }

    public async Task<TaskItemDto> UpdateAsync(Guid id, Guid changedByUserId, UpdateTaskRequest request, CancellationToken cancellationToken = default)
    {
        var task = await FindTaskAsync(id, cancellationToken);

        if (!Enum.TryParse<TaskItemStatus>(request.Status, ignoreCase: true, out var status))
        {
            throw new ValidationAppException($"Estado inválido: \"{request.Status}\".");
        }

        var assignee = task.AssignedToUserId == request.AssignedToUserId
            ? task.AssignedToUser
            : await _db.Users.FindAsync([request.AssignedToUserId], cancellationToken)
                ?? throw new NotFoundException(nameof(Domain.Entities.User), request.AssignedToUserId);

        if (status != task.Status)
        {
            _db.TaskStatusHistories.Add(new TaskStatusHistory
            {
                TaskItemId = task.Id,
                FromStatus = task.Status,
                ToStatus = status,
                ChangedByUserId = changedByUserId
            });
        }

        task.Title = request.Title.Trim();
        task.Description = request.Description?.Trim();
        task.StartDate = request.StartDate;
        task.DueDate = request.DueDate;
        task.Status = status;
        task.AssignedToUserId = assignee.Id;
        task.AssignedToUser = assignee;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return ToDto(task);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var task = await FindTaskAsync(id, cancellationToken);
        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<TaskItemDetailDto> AddCommentAsync(Guid taskId, Guid authorUserId, AddCommentRequest request, CancellationToken cancellationToken = default)
    {
        var task = await FindTaskAsync(taskId, cancellationToken);
        var author = await _db.Users.FindAsync([authorUserId], cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), authorUserId);

        var comment = new TaskComment
        {
            TaskItemId = task.Id,
            AuthorUserId = author.Id,
            Author = author,
            Text = request.Text.Trim()
        };

        // Se agrega al DbSet directamente (no a task.Comments) para que EF Core lo marque
        // sin ambigüedad como Added; EF hace "fixup" solo y también lo refleja en
        // task.Comments porque task ya está siendo trackeado con esa colección cargada.
        _db.TaskComments.Add(comment);

        await _db.SaveChangesAsync(cancellationToken);

        return ToDetailDto(task);
    }

    private async Task<TaskItem> FindTaskAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _db.Tasks
            .Include(t => t.AssignedToUser)
            .Include(t => t.CreatedByUser)
            .Include(t => t.Comments).ThenInclude(c => c.Author)
            .Include(t => t.StatusHistory).ThenInclude(h => h.ChangedByUser)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken)
            ?? throw new NotFoundException(nameof(TaskItem), id);
    }

    private static TaskUserDto ToUserDto(Domain.Entities.User user) =>
        new(user.Id, user.FirstName, user.LastName, user.Email);

    private static TaskItemDto ToDto(TaskItem task) => new(
        task.Id,
        task.Title,
        task.Description,
        task.Status.ToString(),
        task.StartDate,
        task.DueDate,
        ToUserDto(task.AssignedToUser),
        ToUserDto(task.CreatedByUser),
        task.Comments.Count,
        task.CreatedAt);

    private static TaskItemDetailDto ToDetailDto(TaskItem task) => new(
        task.Id,
        task.Title,
        task.Description,
        task.Status.ToString(),
        task.StartDate,
        task.DueDate,
        ToUserDto(task.AssignedToUser),
        ToUserDto(task.CreatedByUser),
        task.Comments
            .OrderBy(c => c.CreatedAt)
            .Select(c => new TaskCommentDto(c.Id, c.Text, ToUserDto(c.Author), c.CreatedAt))
            .ToList(),
        task.StatusHistory
            .OrderBy(h => h.CreatedAt)
            .Select(h => new TaskStatusHistoryDto(h.Id, h.FromStatus?.ToString(), h.ToStatus.ToString(), ToUserDto(h.ChangedByUser), h.CreatedAt))
            .ToList(),
        task.CreatedAt);
}
