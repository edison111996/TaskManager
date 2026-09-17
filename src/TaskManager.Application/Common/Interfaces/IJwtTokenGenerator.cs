using TaskManager.Domain.Entities;

namespace TaskManager.Application.Common.Interfaces;

public record GeneratedAccessToken(string Token, DateTime ExpiresAt);

public interface IJwtTokenGenerator
{
    GeneratedAccessToken GenerateAccessToken(User user, IReadOnlyCollection<string> permissionCodes, IReadOnlyCollection<string> roleNames);
    string GenerateRefreshToken();
}
