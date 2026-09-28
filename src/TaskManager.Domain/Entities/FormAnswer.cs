using TaskManager.Domain.Common;

namespace TaskManager.Domain.Entities;

public class FormAnswer : BaseEntity
{
    public Guid FormSubmissionId { get; set; }
    public FormSubmission FormSubmission { get; set; } = null!;

    public Guid FormFieldId { get; set; }
    public FormField FormField { get; set; } = null!;

    /// <summary>Texto plano: ShortText, Paragraph, Date, Number, SingleChoice, Dropdown.</summary>
    public string? ValueText { get; set; }

    /// <summary>Selecciones de un MultipleChoice — mismo mecanismo JSON que FormField.Options.</summary>
    public List<string>? ValueOptions { get; set; }

    /// <summary>Ruta relativa del archivo subido — solo para FileUpload.</summary>
    public string? FilePath { get; set; }
}
