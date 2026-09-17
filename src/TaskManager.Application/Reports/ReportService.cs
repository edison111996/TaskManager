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

    private const int TrendWeeks = 8;

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

        var trend = await BuildTrendAsync(cancellationToken);

        return new TasksSummaryDto(tasks.Count, byStatus, byUser, trend);
    }

    // Arma la tendencia semana a semana en memoria: traemos solo las fechas (columna
    // liviana) y agrupamos acá, en vez de pelear con "GROUP BY semana" en SQL —
    // EF Core no lo traduce bien y forzarlo a evaluación en cliente sería más lento.
    private async Task<IReadOnlyCollection<TrendPointDto>> BuildTrendAsync(CancellationToken cancellationToken)
    {
        var currentWeekStart = StartOfWeek(DateTime.UtcNow.Date);
        var rangeStart = currentWeekStart.AddDays(-7 * (TrendWeeks - 1));

        var createdDates = await _db.Tasks
            .Where(t => t.CreatedAt >= rangeStart)
            .Select(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        var completedDates = await _db.TaskStatusHistories
            .Where(h => h.ToStatus == TaskItemStatus.Done && h.CreatedAt >= rangeStart)
            .Select(h => h.CreatedAt)
            .ToListAsync(cancellationToken);

        var points = new List<TrendPointDto>();
        for (var i = 0; i < TrendWeeks; i++)
        {
            var weekStart = rangeStart.AddDays(7 * i);
            var weekEnd = weekStart.AddDays(7);
            var created = createdDates.Count(d => d >= weekStart && d < weekEnd);
            var completed = completedDates.Count(d => d >= weekStart && d < weekEnd);
            points.Add(new TrendPointDto(weekStart.ToString("dd/MM"), created, completed));
        }

        return points;
    }

    private static DateTime StartOfWeek(DateTime date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-diff);
    }
}
