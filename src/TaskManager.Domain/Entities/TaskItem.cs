using TaskManager.Domain.Common;
using TaskManager.Domain.Enums;

namespace TaskManager.Domain.Entities;

public class TaskItem : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Pending;
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }

    public Guid AssignedToUserId { get; set; }
    public User AssignedToUser { get; set; } = null!;

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();
    public ICollection<TaskStatusHistory> StatusHistory { get; set; } = new List<TaskStatusHistory>();
}
