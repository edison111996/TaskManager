namespace TaskManager.Application.Reports.Dtos;

public record StatusCountDto(string Status, int Count);

public record UserTaskCountDto(Guid UserId, string UserName, int Count);

public record TasksSummaryDto(
    int Total,
    IReadOnlyCollection<StatusCountDto> ByStatus,
    IReadOnlyCollection<UserTaskCountDto> ByUser);
