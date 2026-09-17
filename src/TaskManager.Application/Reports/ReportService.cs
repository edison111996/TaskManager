using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Reports.Dtos;
using TaskManager.Domain.Enums;

namespace TaskManager.Application.Reports;

public class ReportService : IReportService
{
    private readonly IApplicationDbContext _db;

    public ReportService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<TasksSummaryDto> GetTasksSummaryAsync(CancellationToken cancellationToken = default)
    {
        var tasks = await _db.Tasks
            .Include(t => t.AssignedToUser)
            .ToListAsync(cancellationToken);

        var byStatus = Enum.GetValues<TaskItemStatus>()
            .Select(status => new StatusCountDto(status.ToString(), tasks.Count(t => t.Status == status)))
            .ToList();

        var byUser = tasks
            .GroupBy(t => t.AssignedToUser)
            .Select(g => new UserTaskCountDto(g.Key.Id, $"{g.Key.FirstName} {g.Key.LastName}", g.Count()))
            .OrderByDescending(u => u.Count)
            .ToList();

        return new TasksSummaryDto(tasks.Count, byStatus, byUser);
    }
}
