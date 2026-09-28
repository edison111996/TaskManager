using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskManager.Domain.Entities;

namespace TaskManager.Infrastructure.Persistence.Configurations;

public class FormAnswerConfiguration : IEntityTypeConfiguration<FormAnswer>
{
    public void Configure(EntityTypeBuilder<FormAnswer> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.ValueText).HasMaxLength(4000);
        builder.Property(a => a.FilePath).HasMaxLength(500);

        builder.Property(a => a.ValueOptions)
            .HasConversion(StringListJsonConverter.Converter, StringListJsonConverter.Comparer)
            .HasColumnType("nvarchar(max)");

        // Restrict — no Cascade ni SetNull — porque FormField ya recibe un DELETE en
        // cascada desde FormTemplate (FormTemplateConfiguration). Si esta FK también
        // reaccionara automáticamente, FormField quedaría alcanzable por "dos caminos"
        // desde FormTemplate y SQL Server rechaza la migración (el mismo problema que
        // ya resolvimos con TaskItem->User). En la práctica nunca se dispara: un
        // formulario con respuestas no se puede borrar (ver Restrict en
        // FormTemplateConfiguration), así que para cuando se borra un FormField
        // individual no debería haber respuestas apuntándole.
        builder.HasOne(a => a.FormField)
            .WithMany()
            .HasForeignKey(a => a.FormFieldId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
