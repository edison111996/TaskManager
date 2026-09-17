using TaskManager.Domain.Common;

namespace TaskManager.Domain.Entities;

public class Module : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<Permission> Permissions { get; set; } = new List<Permission>();
}
