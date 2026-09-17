using TaskManager.Application.Modules.Dtos;

namespace TaskManager.Application.Modules;

public interface IModuleService
{
    Task<IReadOnlyCollection<ModuleDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ModuleDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ModuleDto> CreateAsync(CreateModuleRequest request, CancellationToken cancellationToken = default);
    Task<ModuleDto> UpdateAsync(Guid id, UpdateModuleRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
