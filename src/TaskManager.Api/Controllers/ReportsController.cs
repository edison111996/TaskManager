using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Api.Authorization;
using TaskManager.Application.Reports;
using TaskManager.Application.Reports.Dtos;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("tasks-summary")]
    [HasPermission("Reports", "Read")]
    public async Task<ActionResult<TasksSummaryDto>> TasksSummary(CancellationToken cancellationToken)
    {
        return Ok(await _reportService.GetTasksSummaryAsync(cancellationToken));
    }
}
