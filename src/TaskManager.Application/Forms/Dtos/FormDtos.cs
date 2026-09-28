using System.ComponentModel.DataAnnotations;

namespace TaskManager.Application.Forms.Dtos;

public record FormFieldDto(
    Guid Id,
    string Label,
    string Type,
    bool IsRequired,
    int Order,
    IReadOnlyCollection<string>? Options);

public record FormTemplateDto(
    Guid Id,
    string Title,
    string? Description,
    bool IsPublished,
    int SubmissionCount,
    DateTime CreatedAt);

public record FormTemplateDetailDto(
    Guid Id,
    string Title,
    string? Description,
    bool IsPublished,
    int SubmissionCount,
    IReadOnlyCollection<FormFieldDto> Fields,
    DateTime CreatedAt);

public record FormFieldRequest(
    [Required] string Label,
    [Required] string Type,
    bool IsRequired,
    int Order,
    List<string>? Options);

public record CreateFormTemplateRequest(
    [Required] string Title,
    string? Description,
    [Required] List<FormFieldRequest> Fields);

public record UpdateFormTemplateRequest(
    [Required] string Title,
    string? Description,
    [Required] List<FormFieldRequest> Fields);

public record FormAnswerRequest(
    [Required] Guid FormFieldId,
    string? ValueText,
    List<string>? ValueOptions,
    string? FilePath);

public record SubmitFormRequest([Required] List<FormAnswerRequest> Answers);

public record FormAnswerDto(
    Guid FormFieldId,
    string FieldLabel,
    string? ValueText,
    IReadOnlyCollection<string>? ValueOptions,
    string? FilePath);

public record FormSubmissionDto(
    Guid Id,
    string SubmittedByName,
    DateTime CreatedAt,
    IReadOnlyCollection<FormAnswerDto> Answers);
