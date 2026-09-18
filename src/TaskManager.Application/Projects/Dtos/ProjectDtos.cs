using System.ComponentModel.DataAnnotations;

namespace TaskManager.Application.Projects.Dtos;

public record ProjectDto(Guid Id, string Name, string? Description, bool IsActive);

/// <summary>
/// Versión mínima para el selector de "Proyecto" en el formulario de tareas —
/// cualquier usuario que pueda crear/editar tareas la puede pedir, no requiere
/// el permiso de administración completa de proyectos (mismo criterio que
/// UserLookupDto para el selector de "asignado a").
/// </summary>
public record ProjectLookupDto(Guid Id, string Name);

public record CreateProjectRequest([Required] string Name, string? Description);

public record UpdateProjectRequest([Required] string Name, string? Description, bool IsActive);
