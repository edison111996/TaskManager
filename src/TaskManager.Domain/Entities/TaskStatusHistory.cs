using TaskManager.Domain.Common;
using TaskManager.Domain.Enums;

namespace TaskManager.Domain.Entities;

public class TaskStatusHistory : BaseEntity
{
    public Guid TaskItemId { get; set; }
    public TaskItem TaskItem { get; set; } = null!;

    /// <summary>Null en la primera entrada, la que se crea junto con la tarea.</summary>
    public TaskItemStatus? FromStatus { get; set; }
    public TaskItemStatus ToStatus { get; set; }

    public Guid ChangedByUserId { get; set; }
    public User ChangedByUser { get; set; } = null!;

    /// <summary>Null en la primera entrada (creación). Obligatorio en cualquier
    /// transición real de estado — la lógica vive en TaskService, no acá.</summary>
    public string? Comment { get; set; }
}
