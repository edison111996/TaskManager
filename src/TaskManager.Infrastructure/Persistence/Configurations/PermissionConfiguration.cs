using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskManager.Domain.Entities;

namespace TaskManager.Infrastructure.Persistence.Configurations;

public class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Action).IsRequired().HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(p => new { p.ModuleId, p.Action }).IsUnique();

        builder.Ignore(p => p.Code);
    }
}
