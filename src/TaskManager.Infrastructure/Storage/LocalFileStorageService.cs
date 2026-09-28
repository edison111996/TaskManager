using TaskManager.Application.Common.Interfaces;

namespace TaskManager.Infrastructure.Storage;

// La ruta absoluta en disco (uploadsFolder) la calcula el proyecto Api — a partir de
// IWebHostEnvironment, un concepto de hosting que Infrastructure no necesita conocer —
// y se la pasa ya resuelta acá. Infrastructure solo sabe "escribir bytes en una carpeta".
public class LocalFileStorageService : IFileStorageService
{
    private const string PublicPathPrefix = "/uploads/forms";

    private readonly string _uploadsFolder;

    public LocalFileStorageService(string uploadsFolder)
    {
        _uploadsFolder = uploadsFolder;
        Directory.CreateDirectory(_uploadsFolder);
    }

    public async Task<string> SaveAsync(Stream content, string originalFileName, CancellationToken cancellationToken = default)
    {
        // Nunca reusar el nombre original: evita colisiones entre archivos con el mismo
        // nombre y que alguien mande algo como "../../otra-carpeta/archivo" como nombre.
        var extension = Path.GetExtension(originalFileName);
        var fileName = $"{Guid.NewGuid()}{extension}";
        var fullPath = Path.Combine(_uploadsFolder, fileName);

        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream, cancellationToken);

        return $"{PublicPathPrefix}/{fileName}";
    }
}
