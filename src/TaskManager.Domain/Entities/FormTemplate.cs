using TaskManager.Domain.Common;

namespace TaskManager.Domain.Entities;

public class FormTemplate : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }

    /// <summary>Un formulario en borrador no aparece en la lista de "para diligenciar".</summary>
    public bool IsPublished { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public ICollection<FormField> Fields { get; set; } = new List<FormField>();
    public ICollection<FormSubmission> Submissions { get; set; } = new List<FormSubmission>();
}
