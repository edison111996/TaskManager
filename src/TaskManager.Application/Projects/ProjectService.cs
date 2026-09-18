using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Common.Exceptions;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Projects.Dtos;
using TaskManager.Domain.Entities;

namespace TaskManager.Application.Projects;

public class ProjectService : IProjectService
{
    private readonly IApplicationDbContext _db;

    public ProjectService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<ProjectDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var projects = await _db.Projects
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);

        return projects.Select(ToDto).ToList();
    }

    public async Task<ProjectDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await FindProjectAsync(id, cancellationToken);
        return ToDto(project);
    }

    public async Task<IReadOnlyCollection<ProjectLookupDto>> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _db.Projects
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .Select(p => new ProjectLookupDto(p.Id, p.Name))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedName = request.Name.Trim();

        var nameTaken = await _db.Projects.AnyAsync(p => p.Name == normalizedName, cancellationToken);
        if (nameTaken)
        {
            throw new ConflictException($"Ya existe un proyecto con el nombre \"{normalizedName}\".");
        }

        var project = new Project
        {
            Name = normalizedName,
            Description = request.Description?.Trim(),
            IsActive = true
        };

        _db.Projects.Add(project);
        await _db.SaveChangesAsync(cancellationToken);

        return ToDto(project);
    }

    public async Task<ProjectDto> UpdateAsync(Guid id, UpdateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var project = await FindProjectAsync(id, cancellationToken);
        var normalizedName = request.Name.Trim();

        var nameTaken = await _db.Projects.AnyAsync(p => p.Name == normalizedName && p.Id != id, cancellationToken);
        if (nameTaken)
        {
            throw new ConflictException($"Ya existe un proyecto con el nombre \"{normalizedName}\".");
        }

        project.Name = normalizedName;
        project.Description = request.Description?.Trim();
        project.IsActive = request.IsActive;
        project.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return ToDto(project);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await FindProjectAsync(id, cancellationToken);
        _db.Projects.Remove(project);
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<Project> FindProjectAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken)
            ?? throw new NotFoundException(nameof(Project), id);
    }

    private static ProjectDto ToDto(Project project) =>
        new(project.Id, project.Name, project.Description, project.IsActive);
}
