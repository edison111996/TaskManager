using TaskManager.Domain.Common;

namespace TaskManager.Domain.Entities;

public class TaskComment : BaseEntity
{
    public Guid TaskItemId { get; set; }
    public TaskItem TaskItem { get; set; } = null!;

    public Guid AuthorUserId { get; set; }
    public User Author { get; set; } = null!;

    public string Text { get; set; } = string.Empty;
}
