using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskManager.Domain.Entities;

namespace TaskManager.Infrastructure.Persistence.Configurations;

public class FormSubmissionConfiguration : IEntityTypeConfiguration<FormSubmission>
{
    public void Configure(EntityTypeBuilder<FormSubmission> builder)
    {
        builder.HasKey(s => s.Id);

        builder.HasOne(s => s.SubmittedByUser)
            .WithMany()
            .HasForeignKey(s => s.SubmittedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Las respuestas puntuales no existen sin la respuesta completa que las contiene.
        builder.HasMany(s => s.Answers)
            .WithOne(a => a.FormSubmission)
            .HasForeignKey(a => a.FormSubmissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
