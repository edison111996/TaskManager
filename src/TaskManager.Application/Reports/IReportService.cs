using TaskManager.Application.Reports.Dtos;

namespace TaskManager.Application.Reports;

public interface IReportService
{
    Task<TasksSummaryDto> GetTasksSummaryAsync(CancellationToken cancellationToken = default);
}
