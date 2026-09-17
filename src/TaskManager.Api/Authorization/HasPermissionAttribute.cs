using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace TaskManager.Api.Authorization;

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class HasPermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _permissionCode;

    public HasPermissionAttribute(string module, string action)
    {
        _permissionCode = $"{module}:{action}";
    }

    public Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (user.Identity is not { IsAuthenticated: true })
        {
            context.Result = new ChallengeResult();
            return Task.CompletedTask;
        }

        var hasPermission = user.Claims.Any(c => c.Type == "permission" && c.Value == _permissionCode);
        if (!hasPermission)
        {
            context.Result = new ForbidResult();
        }

        return Task.CompletedTask;
    }
}
