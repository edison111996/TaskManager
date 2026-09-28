using TaskManager.Domain.Common;

namespace TaskManager.Domain.Entities;

public class FormSubmission : BaseEntity
{
    public Guid FormTemplateId { get; set; }
    public FormTemplate FormTemplate { get; set; } = null!;

    public Guid SubmittedByUserId { get; set; }
    public User SubmittedByUser { get; set; } = null!;

    public ICollection<FormAnswer> Answers { get; set; } = new List<FormAnswer>();
}
