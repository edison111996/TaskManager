using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskManager.Domain.Entities;

namespace TaskManager.Infrastructure.Persistence.Configurations;

public class FormFieldConfiguration : IEntityTypeConfiguration<FormField>
{
    public void Configure(EntityTypeBuilder<FormField> builder)
    {
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Label).IsRequired().HasMaxLength(300);
        builder.Property(f => f.Type).IsRequired().HasConversion<string>().HasMaxLength(20);

        builder.Property(f => f.Options)
            .HasConversion(StringListJsonConverter.Converter, StringListJsonConverter.Comparer)
            .HasColumnType("nvarchar(max)");
    }
}
