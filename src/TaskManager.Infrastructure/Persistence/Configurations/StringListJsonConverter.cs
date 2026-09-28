using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace TaskManager.Infrastructure.Persistence.Configurations;

// EF Core no tiene un tipo de columna "lista de strings" — la alternativa habitual
// sería una tabla aparte solo para eso (FormFieldOption con FormFieldId + Texto),
// pero acá alcanza con guardar la lista como JSON en una sola columna de texto.
// Compartido entre FormField.Options y FormAnswer.ValueOptions.
public static class StringListJsonConverter
{
    public static readonly ValueConverter<List<string>?, string?> Converter = new(
        v => v == null ? null : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
        v => v == null ? null : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null));

    // Sin esto, EF Core no sabe detectar cambios dentro de la lista (compararía por
    // referencia, no por contenido) y avisa con un warning al armar el modelo.
    public static readonly ValueComparer<List<string>?> Comparer = new(
        (a, b) => (a ?? new List<string>()).SequenceEqual(b ?? new List<string>()),
        v => v == null ? 0 : v.Aggregate(0, (hash, s) => HashCode.Combine(hash, s)),
        v => v == null ? null : v.ToList());
}
