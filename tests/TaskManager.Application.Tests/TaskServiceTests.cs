using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Common.Exceptions;
using TaskManager.Application.Tasks;
using TaskManager.Application.Tasks.Dtos;
using TaskManager.Domain.Entities;
using TaskManager.Domain.Enums;
using TaskManager.Infrastructure.Persistence;

namespace TaskManager.Application.Tests;

// Patrón de cada test: Arrange (preparar datos) -> Act (ejecutar) -> Assert (verificar).
// Cada test crea su propia base de datos en memoria con un nombre único (Guid), así
// no comparten datos entre sí y el orden en que corran no importa.
public class TaskServiceTests
{
    private static TaskManagerDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<TaskManagerDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new TaskManagerDbContext(options);
    }

    private static async Task<User> AddUserAsync(TaskManagerDbContext db, string firstName = "Ana")
    {
        var user = new User { FirstName = firstName, LastName = "Test", Email = $"{firstName}@test.com" };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    private static CreateTaskRequest NewTaskRequest(Guid assigneeId, string title = "  Mi tarea  ") =>
        new(title, null, null, null, null, assigneeId);

    private static UpdateTaskRequest UpdateRequest(Guid assigneeId, string status, string? comment = null) =>
        new("Mi tarea", null, null, null, null, status, comment, assigneeId);

    [Fact]
    public async Task CreateAsync_StartsAsPending_TrimsTitle_AndRecordsInitialHistory()
    {
        await using var db = CreateDb();
        var user = await AddUserAsync(db);
        var service = new TaskService(db);

        var result = await service.CreateAsync(user.Id, NewTaskRequest(user.Id));

        Assert.Equal("Mi tarea", result.Title);
        Assert.Equal(TaskItemStatus.Pending, (await db.Tasks.SingleAsync()).Status);
        var history = await db.TaskStatusHistories.SingleAsync();
        Assert.Null(history.FromStatus);
        Assert.Equal(TaskItemStatus.Pending, history.ToStatus);
    }

    [Fact]
    public async Task CreateAsync_WithUnknownAssignee_ThrowsNotFound()
    {
        await using var db = CreateDb();
        var creator = await AddUserAsync(db);
        var service = new TaskService(db);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            service.CreateAsync(creator.Id, NewTaskRequest(Guid.NewGuid())));
    }

    [Fact]
    public async Task UpdateAsync_ChangingStatusWithoutComment_ThrowsValidation()
    {
        await using var db = CreateDb();
        var user = await AddUserAsync(db);
        var service = new TaskService(db);
        var created = await service.CreateAsync(user.Id, NewTaskRequest(user.Id));

        await Assert.ThrowsAsync<ValidationAppException>(() =>
            service.UpdateAsync(created.Id, user.Id, UpdateRequest(user.Id, "Done", comment: "   ")));

        // Y no se debe haber guardado el cambio a medias.
        Assert.Equal(TaskItemStatus.Pending, (await db.Tasks.SingleAsync()).Status);
    }

    [Fact]
    public async Task UpdateAsync_ChangingStatusWithComment_SavesAndRecordsHistory()
    {
        await using var db = CreateDb();
        var user = await AddUserAsync(db);
        var service = new TaskService(db);
        var created = await service.CreateAsync(user.Id, NewTaskRequest(user.Id));

        await service.UpdateAsync(created.Id, user.Id, UpdateRequest(user.Id, "InProgress", "Arranqué hoy"));

        Assert.Equal(TaskItemStatus.InProgress, (await db.Tasks.SingleAsync()).Status);
        var last = await db.TaskStatusHistories.OrderByDescending(h => h.CreatedAt).FirstAsync();
        Assert.Equal(TaskItemStatus.Pending, last.FromStatus);
        Assert.Equal(TaskItemStatus.InProgress, last.ToStatus);
        Assert.Equal("Arranqué hoy", last.Comment);
    }

    [Fact]
    public async Task UpdateAsync_KeepingSameStatus_DoesNotRequireCommentNorAddHistory()
    {
        await using var db = CreateDb();
        var user = await AddUserAsync(db);
        var service = new TaskService(db);
        var created = await service.CreateAsync(user.Id, NewTaskRequest(user.Id));

        await service.UpdateAsync(created.Id, user.Id, UpdateRequest(user.Id, "Pending"));

        Assert.Equal(1, await db.TaskStatusHistories.CountAsync()); // solo el de la creación
    }

    [Fact]
    public async Task UpdateAsync_WithInvalidStatus_ThrowsValidation()
    {
        await using var db = CreateDb();
        var user = await AddUserAsync(db);
        var service = new TaskService(db);
        var created = await service.CreateAsync(user.Id, NewTaskRequest(user.Id));

        await Assert.ThrowsAsync<ValidationAppException>(() =>
            service.UpdateAsync(created.Id, user.Id, UpdateRequest(user.Id, "Inventado", "x")));
    }

    [Fact]
    public async Task GetByIdAsync_WithUnknownId_ThrowsNotFound()
    {
        await using var db = CreateDb();
        var service = new TaskService(db);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetByIdAsync(Guid.NewGuid()));
    }
}
