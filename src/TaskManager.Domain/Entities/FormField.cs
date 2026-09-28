using TaskManager.Domain.Common;
using TaskManager.Domain.Enums;

namespace TaskManager.Domain.Entities;

public class FormField : BaseEntity
{
    public Guid FormTemplateId { get; set; }
    public FormTemplate FormTemplate { get; set; } = null!;

    public string Label { get; set; } = string.Empty;
    public FormFieldType Type { get; set; }
    public bool IsRequired { get; set; }

    /// <summary>Posición dentro del formulario — la usa el drag-and-drop del constructor.</summary>
    public int Order { get; set; }

    /// <summary>Solo para SingleChoice/MultipleChoice/Dropdown. Null para el resto de los tipos.</summary>
    public List<string>? Options { get; set; }
}
