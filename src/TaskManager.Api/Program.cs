using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using TaskManager.Api.Middleware;
using TaskManager.Api.OpenApi;
using TaskManager.Application;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Common.Options;
using TaskManager.Infrastructure;
using TaskManager.Infrastructure.Persistence;
using TaskManager.Infrastructure.Persistence.Seed;

// Community: gratis para individuos/empresas con facturación anual menor a ~1M USD
// (más que de sobra para este proyecto). Sin esto, QuestPDF tira excepción al generar.
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        // Por defecto, [ApiController] responde a los errores de validación de los DTOs
        // ([Required], [EmailAddress]...) con su propio formato, que no trae "message" y
        // por eso el front solo veía "Error 400". Lo unificamos con el formato del middleware
        // de excepciones y agregamos "errors" (campo -> mensajes) para pintarlos bajo cada input.
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(entry => entry.Value is { Errors.Count: > 0 })
                .ToDictionary(
                    entry => ToCamelCase(entry.Key),
                    entry => entry.Value!.Errors
                        .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Valor inválido." : e.ErrorMessage)
                        .ToArray());

            var message = errors.Values.SelectMany(m => m).FirstOrDefault() ?? "Hay errores de validación.";

            return new BadRequestObjectResult(new { status = 400, message, errors });
        };
    });

var uploadsFolder = Path.Combine(builder.Environment.ContentRootPath, "wwwroot", "uploads", "forms");

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, uploadsFolder);

var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
    ?? throw new InvalidOperationException("Falta la sección \"Jwt\" en la configuración.");

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// Límite de intentos en login/registro: frena la prueba masiva de contraseñas (fuerza bruta).
// Por IP: 10 intentos por minuto; al pasarse responde 429 con el mismo formato JSON de los demás errores.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"status\":429,\"message\":\"Demasiados intentos. Espera un minuto e inténtalo de nuevo.\"}",
            cancellationToken);
    };
});

const string FrontendCorsPolicy = "Frontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.Title = "TaskManager API";
    });

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<TaskManagerDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    await dbContext.Database.MigrateAsync();
    await DbSeeder.SeedAsync(dbContext, passwordHasher);
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Cabeceras de seguridad básicas: evitan que el navegador "adivine" tipos de archivo,
// que la API se muestre dentro de un iframe ajeno y que se filtre la URL como referrer.
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles(); // sirve wwwroot/uploads/forms/... como /uploads/forms/...

app.UseCors(FrontendCorsPolicy);

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// "FirstName" -> "firstName": así coincide con los nombres de campo que usa el front.
static string ToCamelCase(string key) =>
    string.IsNullOrEmpty(key) ? key : char.ToLowerInvariant(key[0]) + key[1..];
