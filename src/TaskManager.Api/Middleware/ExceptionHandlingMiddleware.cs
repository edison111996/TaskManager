using System.Net;
using System.Text.Json;
using TaskManager.Application.Common.Exceptions;

namespace TaskManager.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var (statusCode, title) = ex switch
            {
                NotFoundException => (HttpStatusCode.NotFound, ex.Message),
                ConflictException => (HttpStatusCode.Conflict, ex.Message),
                ValidationAppException => (HttpStatusCode.BadRequest, ex.Message),
                UnauthorizedAppException => (HttpStatusCode.Unauthorized, ex.Message),
                _ => (HttpStatusCode.InternalServerError, "Ocurrió un error inesperado.")
            };

            if (statusCode == HttpStatusCode.InternalServerError)
            {
                _logger.LogError(ex, "Error no controlado procesando {Path}", context.Request.Path);
            }

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var payload = JsonSerializer.Serialize(new { status = (int)statusCode, message = title });
            await context.Response.WriteAsync(payload);
        }
    }
}
