using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskManager.Domain.Entities;

namespace TaskManager.Infrastructure.Persistence.Configurations;

public class ModuleConfiguration : IEntityTypeConfiguration<Module>
{
    public void Configure(EntityTypeBuilder<Module> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Name).IsRequired().HasMaxLength(100);
        builder.Property(m => m.Code).IsRequired().HasMaxLength(50);
        builder.Property(m => m.Description).HasMaxLength(500);

        builder.HasIndex(m => m.Code).IsUnique();

        builder.HasMany(m => m.Permissions)
            .WithOne(p => p.Module)
            .HasForeignKey(p => p.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
