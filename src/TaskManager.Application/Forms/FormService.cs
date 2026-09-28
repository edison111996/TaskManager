using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Common.Exceptions;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Forms.Dtos;
using TaskManager.Domain.Entities;
using TaskManager.Domain.Enums;

namespace TaskManager.Application.Forms;

public class FormService : IFormService
{
    private readonly IApplicationDbContext _db;

    public FormService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<FormTemplateDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var forms = await _db.FormTemplates
            .Include(f => f.Submissions)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        return forms.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyCollection<FormTemplateDto>> GetPublishedAsync(CancellationToken cancellationToken = default)
    {
        var forms = await _db.FormTemplates
            .Include(f => f.Submissions)
            .Where(f => f.IsPublished)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync(cancellationToken);

        return forms.Select(ToDto).ToList();
    }

    public async Task<FormTemplateDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var form = await FindFormAsync(id, cancellationToken);
        return ToDetailDto(form);
    }

    public async Task<FormTemplateDetailDto> GetForFillAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var form = await FindFormAsync(id, cancellationToken);
        if (!form.IsPublished)
        {
            throw new NotFoundException(nameof(FormTemplate), id);
        }

        return ToDetailDto(form);
    }

    public async Task<FormTemplateDto> CreateAsync(Guid createdByUserId, CreateFormTemplateRequest request, CancellationToken cancellationToken = default)
    {
        var creator = await _db.Users.FindAsync([createdByUserId], cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), createdByUserId);

        var form = new FormTemplate
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            IsPublished = false,
            CreatedByUserId = creator.Id,
            CreatedByUser = creator
        };

        foreach (var field in BuildFields(request.Fields))
        {
            form.Fields.Add(field);
        }

        _db.FormTemplates.Add(form);
        await _db.SaveChangesAsync(cancellationToken);

        return ToDto(form);
    }

    public async Task<FormTemplateDto> UpdateAsync(Guid id, UpdateFormTemplateRequest request, CancellationToken cancellationToken = default)
    {
        var form = await FindFormAsync(id, cancellationToken);

        if (form.Submissions.Count > 0)
        {
            throw new ConflictException(
                "No se pueden editar las preguntas de un formulario que ya tiene respuestas. Despublicalo y creá uno nuevo si necesitás cambiarlo.");
        }

        form.Title = request.Title.Trim();
        form.Description = request.Description?.Trim();
        form.UpdatedAt = DateTime.UtcNow;

        // Reemplazo total de los campos: como ya confirmamos que no hay respuestas,
        // ningún FormAnswer apunta a los campos viejos — se pueden tirar y recrear
        // sin chocar con el Restrict de FormAnswers.FormFieldId.
        //
        // ExecuteDeleteAsync en vez de RemoveRange/Clear a propósito: genera un DELETE
        // SQL directo (DELETE FROM FormFields WHERE FormTemplateId = @id) sin pasar por
        // el change tracker de EF Core. Con RemoveRange/Clear, editar un formulario que
        // ya tenía campos guardados de una sesión anterior disparaba
        // DbUpdateConcurrencyException ("0 rows affected") — el tracker se confundía
        // sobre qué filas borrar. Un DELETE a nivel SQL no tiene ese problema porque no
        // depende de qué entidades quedaron trackeadas en memoria.
        await _db.FormFields
            .Where(f => f.FormTemplateId == form.Id)
            .ExecuteDeleteAsync(cancellationToken);

        foreach (var field in BuildFields(request.Fields))
        {
            field.FormTemplateId = form.Id;
            _db.FormFields.Add(field);
        }

        await _db.SaveChangesAsync(cancellationToken);

        return ToDto(form);
    }

    public async Task<FormTemplateDto> SetPublishedAsync(Guid id, bool isPublished, CancellationToken cancellationToken = default)
    {
        var form = await FindFormAsync(id, cancellationToken);
        form.IsPublished = isPublished;
        form.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return ToDto(form);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var form = await FindFormAsync(id, cancellationToken);

        if (form.Submissions.Count > 0)
        {
            throw new ConflictException("No se puede eliminar un formulario que ya tiene respuestas.");
        }

        _db.FormTemplates.Remove(form);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task SubmitAsync(Guid formTemplateId, Guid submittedByUserId, SubmitFormRequest request, CancellationToken cancellationToken = default)
    {
        var form = await FindFormAsync(formTemplateId, cancellationToken);

        if (!form.IsPublished)
        {
            throw new ValidationAppException("Este formulario no está publicado.");
        }

        var submitter = await _db.Users.FindAsync([submittedByUserId], cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.User), submittedByUserId);

        // Por si el cliente manda el mismo campo dos veces: nos quedamos con la primera.
        var answersByFieldId = request.Answers
            .GroupBy(a => a.FormFieldId)
            .ToDictionary(g => g.Key, g => g.First());

        foreach (var field in form.Fields)
        {
            var hasAnswer = answersByFieldId.TryGetValue(field.Id, out var answer)
                && (!string.IsNullOrWhiteSpace(answer.ValueText) || answer.ValueOptions is { Count: > 0 } || !string.IsNullOrWhiteSpace(answer.FilePath));

            if (field.IsRequired && !hasAnswer)
            {
                throw new ValidationAppException($"\"{field.Label}\" es obligatorio.");
            }
        }

        var submission = new FormSubmission
        {
            FormTemplateId = form.Id,
            SubmittedByUserId = submitter.Id
        };

        _db.FormSubmissions.Add(submission);

        var validFieldIds = form.Fields.Select(f => f.Id).ToHashSet();

        foreach (var answer in answersByFieldId.Values)
        {
            // Nunca confiar en que el cliente solo mande IDs de campos de este formulario.
            if (!validFieldIds.Contains(answer.FormFieldId)) continue;

            _db.FormAnswers.Add(new FormAnswer
            {
                FormSubmissionId = submission.Id,
                FormFieldId = answer.FormFieldId,
                ValueText = answer.ValueText?.Trim(),
                ValueOptions = answer.ValueOptions,
                FilePath = answer.FilePath
            });
        }

        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<FormSubmissionDto>> GetSubmissionsAsync(Guid formTemplateId, CancellationToken cancellationToken = default)
    {
        var submissions = await _db.FormSubmissions
            .Include(s => s.SubmittedByUser)
            .Include(s => s.Answers).ThenInclude(a => a.FormField)
            .Where(s => s.FormTemplateId == formTemplateId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return submissions.Select(s => new FormSubmissionDto(
                s.Id,
                $"{s.SubmittedByUser.FirstName} {s.SubmittedByUser.LastName}",
                s.CreatedAt,
                s.Answers
                    .Select(a => new FormAnswerDto(a.FormFieldId, a.FormField.Label, a.ValueText, a.ValueOptions, a.FilePath))
                    .ToList()))
            .ToList();
    }

    private static IEnumerable<FormField> BuildFields(List<FormFieldRequest> requests)
    {
        foreach (var request in requests)
        {
            if (!Enum.TryParse<FormFieldType>(request.Type, ignoreCase: true, out var type))
            {
                throw new ValidationAppException($"Tipo de campo inválido: \"{request.Type}\".");
            }

            yield return new FormField
            {
                Label = request.Label.Trim(),
                Type = type,
                IsRequired = request.IsRequired,
                Order = request.Order,
                Options = request.Options?.Select(o => o.Trim()).Where(o => o.Length > 0).ToList()
            };
        }
    }

    private async Task<FormTemplate> FindFormAsync(Guid id, CancellationToken cancellationToken)
    {
        // Include SIN ordenar a propósito — ver el comentario en UpdateAsync sobre por
        // qué un Include ordenado + Clear()/RemoveRange no es una buena combinación. El
        // orden para mostrar se aplica en memoria donde hace falta (ToDetailDto).
        return await _db.FormTemplates
            .Include(f => f.Fields)
            .Include(f => f.Submissions)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken)
            ?? throw new NotFoundException(nameof(FormTemplate), id);
    }

    private static FormFieldDto ToFieldDto(FormField field) =>
        new(field.Id, field.Label, field.Type.ToString(), field.IsRequired, field.Order, field.Options);

    private static FormTemplateDto ToDto(FormTemplate form) => new(
        form.Id,
        form.Title,
        form.Description,
        form.IsPublished,
        form.Submissions.Count,
        form.CreatedAt);

    private static FormTemplateDetailDto ToDetailDto(FormTemplate form) => new(
        form.Id,
        form.Title,
        form.Description,
        form.IsPublished,
        form.Submissions.Count,
        form.Fields.OrderBy(f => f.Order).Select(ToFieldDto).ToList(),
        form.CreatedAt);
}
