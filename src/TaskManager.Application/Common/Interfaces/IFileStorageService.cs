namespace TaskManager.Application.Common.Interfaces;

public interface IFileStorageService
{
    /// <summary>Guarda el archivo y devuelve la ruta pública relativa para acceder a él (ej. "/uploads/forms/xxxx.png").</summary>
    Task<string> SaveAsync(Stream content, string originalFileName, CancellationToken cancellationToken = default);
}
