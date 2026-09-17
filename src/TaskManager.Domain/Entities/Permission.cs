using TaskManager.Domain.Common;
using TaskManager.Domain.Enums;

namespace TaskManager.Domain.Entities;

public class Permission : BaseEntity
{
    public Guid ModuleId { get; set; }
    public Module Module { get; set; } = null!;
    public PermissionAction Action { get; set; }

    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();

    public string Code => $"{Module?.Code}:{Action}";
}
