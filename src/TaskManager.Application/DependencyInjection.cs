using Microsoft.Extensions.DependencyInjection;
using TaskManager.Application.Auth;
using TaskManager.Application.Modules;
using TaskManager.Application.Reports;
using TaskManager.Application.Roles;
using TaskManager.Application.Tasks;
using TaskManager.Application.Users;

namespace TaskManager.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IRoleService, RoleService>();
        services.AddScoped<IModuleService, ModuleService>();
        services.AddScoped<ITaskService, TaskService>();
        services.AddScoped<IReportService, ReportService>();

        return services;
    }
}
