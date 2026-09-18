using TaskManager.Application.Projects.Dtos;

namespace TaskManager.Application.Projects;

public interface IProjectService
{
    Task<IReadOnlyCollection<ProjectDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ProjectDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ProjectLookupDto>> GetActiveAsync(CancellationToken cancellationToken = default);
    Task<ProjectDto> CreateAsync(CreateProjectRequest request, CancellationToken cancellationToken = default);
    Task<ProjectDto> UpdateAsync(Guid id, UpdateProjectRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
