using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Common.Exceptions;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Application.Modules.Dtos;
using TaskManager.Domain.Entities;
using TaskManager.Domain.Enums;

namespace TaskManager.Application.Modules;

public class ModuleService : IModuleService
{
    private readonly IApplicationDbContext _db;

    public ModuleService(IApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyCollection<ModuleDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var modules = await _db.Modules
            .Include(m => m.Permissions)
            .OrderBy(m => m.Name)
            .ToListAsync(cancellationToken);

        return modules.Select(ToDto).ToList();
    }

    public async Task<ModuleDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var module = await FindModuleAsync(id, cancellationToken);
        return ToDto(module);
    }

    public async Task<ModuleDto> CreateAsync(CreateModuleRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedCode = request.Code.Trim();

        var codeTaken = await _db.Modules.AnyAsync(m => m.Code == normalizedCode, cancellationToken);
        if (codeTaken)
        {
            throw new ConflictException($"Ya existe un módulo con el código \"{normalizedCode}\".");
        }

        var module = new Module
        {
            Name = request.Name.Trim(),
            Code = normalizedCode,
            Description = request.Description?.Trim()
        };

        foreach (var action in Enum.GetValues<PermissionAction>())
        {
            module.Permissions.Add(new Permission { ModuleId = module.Id, Module = module, Action = action });
        }

        _db.Modules.Add(module);
        await _db.SaveChangesAsync(cancellationToken);

        return ToDto(module);
    }

    public async Task<ModuleDto> UpdateAsync(Guid id, UpdateModuleRequest request, CancellationToken cancellationToken = default)
    {
        var module = await FindModuleAsync(id, cancellationToken);

        module.Name = request.Name.Trim();
        module.Description = request.Description?.Trim();
        module.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);

        return ToDto(module);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var module = await FindModuleAsync(id, cancellationToken);
        _db.Modules.Remove(module);
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task<Module> FindModuleAsync(Guid id, CancellationToken cancellationToken)
    {
        return await _db.Modules
            .Include(m => m.Permissions)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken)
            ?? throw new NotFoundException(nameof(Module), id);
    }

    private static ModuleDto ToDto(Module module)
    {
        var permissions = module.Permissions
            .OrderBy(p => p.Action)
            .Select(p => new PermissionDto(p.Id, p.Action.ToString(), $"{module.Code}:{p.Action}"))
            .ToList();

        return new ModuleDto(module.Id, module.Name, module.Code, module.Description, permissions);
    }
}
