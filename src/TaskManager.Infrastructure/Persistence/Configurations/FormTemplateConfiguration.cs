using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskManager.Domain.Entities;

namespace TaskManager.Infrastructure.Persistence.Configurations;

public class FormTemplateConfiguration : IEntityTypeConfiguration<FormTemplate>
{
    public void Configure(EntityTypeBuilder<FormTemplate> builder)
    {
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Title).IsRequired().HasMaxLength(200);
        builder.Property(f => f.Description).HasMaxLength(1000);

        builder.HasOne(f => f.CreatedByUser)
            .WithMany()
            .HasForeignKey(f => f.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Los campos son estructura del formulario — no tiene sentido conservarlos huérfanos.
        builder.HasMany(f => f.Fields)
            .WithOne(field => field.FormTemplate)
            .HasForeignKey(field => field.FormTemplateId)
            .OnDelete(DeleteBehavior.Cascade);

        // Restrict a propósito: FormService.DeleteAsync bloquea con un mensaje claro el
        // borrado de un formulario que ya tiene respuestas, en vez de dejar que fallen
        // en cascada — ver el comentario en FormAnswerConfiguration sobre por qué.
        builder.HasMany(f => f.Submissions)
            .WithOne(s => s.FormTemplate)
            .HasForeignKey(s => s.FormTemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
