using TaskManager.Application.Forms.Dtos;

namespace TaskManager.Application.Forms;

public interface IFormService
{
    /// <summary>Todos los formularios (borradores incluidos) — para el constructor, admin.</summary>
    Task<IReadOnlyCollection<FormTemplateDto>> GetAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Solo los publicados — para la lista de "para diligenciar", cualquier usuario.</summary>
    Task<IReadOnlyCollection<FormTemplateDto>> GetPublishedAsync(CancellationToken cancellationToken = default);

    Task<FormTemplateDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Igual que GetByIdAsync, pero para quien va a diligenciarlo: un formulario
    /// no publicado no existe desde este ángulo, sin importar quién lo pida.</summary>
    Task<FormTemplateDetailDto> GetForFillAsync(Guid id, CancellationToken cancellationToken = default);
    Task<FormTemplateDto> CreateAsync(Guid createdByUserId, CreateFormTemplateRequest request, CancellationToken cancellationToken = default);
    Task<FormTemplateDto> UpdateAsync(Guid id, UpdateFormTemplateRequest request, CancellationToken cancellationToken = default);
    Task<FormTemplateDto> SetPublishedAsync(Guid id, bool isPublished, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);

    Task SubmitAsync(Guid formTemplateId, Guid submittedByUserId, SubmitFormRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<FormSubmissionDto>> GetSubmissionsAsync(Guid formTemplateId, CancellationToken cancellationToken = default);
}
