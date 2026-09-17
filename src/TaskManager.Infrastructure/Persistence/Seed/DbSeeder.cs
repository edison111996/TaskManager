using Microsoft.EntityFrameworkCore;
using TaskManager.Application.Common.Interfaces;
using TaskManager.Domain.Entities;
using TaskManager.Domain.Enums;

namespace TaskManager.Infrastructure.Persistence.Seed;

public static class DbSeeder
{
    private const string AdminEmail = "admin@taskmanager.local";
    private const string AdminPassword = "Admin123!";
    private const string AdminRoleName = "Admin";
    private const string UserRoleName = "User";

    private record ModuleSeed(string Code, string Name, string Description);

    // Agregar un módulo nuevo al sistema = agregar una línea aquí. El resto (crear el
    // módulo si falta, crear sus 4 permisos si faltan, dárselos al rol Admin) es automático
    // y se puede correr las veces que sea sin duplicar ni borrar nada.
    private static readonly ModuleSeed[] ModuleSeeds =
    [
        new("Users", "Usuarios", "Gestión de usuarios del sistema"),
        new("Roles", "Roles", "Gestión de roles"),
        new("Modules", "Módulos", "Catálogo de módulos y permisos"),
        new("Tasks", "Tareas", "Seguimiento de tareas por usuario"),
        new("Reports", "Informes", "Reportes agregados del sistema")
    ];

    public static async Task SeedAsync(TaskManagerDbContext context, IPasswordHasher passwordHasher)
    {
        var adminRole = await context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Name == AdminRoleName);

        var isFirstRun = adminRole is null;

        if (isFirstRun)
        {
            adminRole = new Role { Name = AdminRoleName, Description = "Acceso total al sistema" };
            context.Roles.Add(adminRole);
            context.Roles.Add(new Role { Name = UserRoleName, Description = "Usuario estándar sin permisos administrativos" });
        }

        foreach (var moduleSeed in ModuleSeeds)
        {
            var module = await context.Modules
                .Include(m => m.Permissions)
                .FirstOrDefaultAsync(m => m.Code == moduleSeed.Code);

            if (module is null)
            {
                module = new Module { Name = moduleSeed.Name, Code = moduleSeed.Code, Description = moduleSeed.Description };
                context.Modules.Add(module);
            }

            foreach (var action in Enum.GetValues<PermissionAction>())
            {
                if (module.Permissions.Any(p => p.Action == action))
                {
                    continue;
                }

                var permission = new Permission { ModuleId = module.Id, Module = module, Action = action };
                module.Permissions.Add(permission);
                context.Permissions.Add(permission);
            }

            foreach (var permission in module.Permissions)
            {
                if (adminRole!.RolePermissions.Any(rp => rp.PermissionId == permission.Id))
                {
                    continue;
                }

                adminRole.RolePermissions.Add(new RolePermission
                {
                    RoleId = adminRole.Id,
                    PermissionId = permission.Id,
                    Role = adminRole,
                    Permission = permission
                });
            }
        }

        if (isFirstRun)
        {
            var adminUser = new User
            {
                FirstName = "Admin",
                LastName = "TaskManager",
                Email = AdminEmail,
                PasswordHash = passwordHasher.Hash(AdminPassword),
                IsActive = true
            };
            adminUser.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole!.Id, User = adminUser, Role = adminRole });
            context.Users.Add(adminUser);
        }

        await context.SaveChangesAsync();
    }
}
