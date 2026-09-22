using System.ComponentModel.DataAnnotations;

namespace TaskManager.Application.Tasks.Dtos;

public record TaskUserDto(Guid Id, string FirstName, string LastName, string Email);

public record TaskProjectDto(Guid Id, string Name);

public record TaskCommentDto(Guid Id, string Text, TaskUserDto Author, DateTime CreatedAt);

public record TaskStatusHistoryDto(
    Guid Id,
    string? FromStatus,
    string ToStatus,
    string? Comment,
    TaskUserDto ChangedBy,
    DateTime CreatedAt);

public record TaskItemDto(
    Guid Id,
    string Title,
    string? Description,
    string Status,
    DateTime? StartDate,
    DateTime? DueDate,
    TaskProjectDto? Project,
    TaskUserDto AssignedTo,
    TaskUserDto CreatedBy,
    int CommentCount,
    DateTime CreatedAt);

public record TaskItemDetailDto(
    Guid Id,
    string Title,
    string? Description,
    string Status,
    DateTime? StartDate,
    DateTime? DueDate,
    TaskProjectDto? Project,
    TaskUserDto AssignedTo,
    TaskUserDto CreatedBy,
    IReadOnlyCollection<TaskCommentDto> Comments,
    IReadOnlyCollection<TaskStatusHistoryDto> StatusHistory,
    DateTime CreatedAt);

public record CreateTaskRequest(
    [Required] string Title,
    string? Description,
    DateTime? StartDate,
    DateTime? DueDate,
    Guid? ProjectId,
    [Required] Guid AssignedToUserId);

public record UpdateTaskRequest(
    [Required] string Title,
    string? Description,
    DateTime? StartDate,
    DateTime? DueDate,
    Guid? ProjectId,
    [Required] string Status,
    // Obligatorio solo cuando Status difiere del estado actual de la tarea —
    // TaskService.UpdateAsync es quien valida eso, acá no puede saberse de antemano.
    string? StatusChangeComment,
    [Required] Guid AssignedToUserId);

public record AddCommentRequest([Required] string Text);
