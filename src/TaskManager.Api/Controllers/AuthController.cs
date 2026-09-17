using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskManager.Application.Auth;
using TaskManager.Application.Auth.Dtos;

namespace TaskManager.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string RefreshTokenCookieName = "refreshToken";

    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterAsync(request, cancellationToken);
        SetRefreshTokenCookie(response.RefreshToken, response.RefreshTokenExpiresAt);
        return Ok(ToBrowserResponse(response));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, cancellationToken);
        SetRefreshTokenCookie(response.RefreshToken, response.RefreshTokenExpiresAt);
        return Ok(ToBrowserResponse(response));
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    public async Task<ActionResult> RefreshToken(RefreshTokenRequest? request, CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName] ?? request?.RefreshToken
            ?? throw new Application.Common.Exceptions.UnauthorizedAppException("No se encontró un refresh token.");

        var response = await _authService.RefreshTokenAsync(refreshToken, cancellationToken);
        SetRefreshTokenCookie(response.RefreshToken, response.RefreshTokenExpiresAt);
        return Ok(ToBrowserResponse(response));
    }

    [HttpPost("revoke-token")]
    [AllowAnonymous]
    public async Task<IActionResult> RevokeToken(RevokeTokenRequest? request, CancellationToken cancellationToken)
    {
        var refreshToken = Request.Cookies[RefreshTokenCookieName] ?? request?.RefreshToken
            ?? throw new Application.Common.Exceptions.UnauthorizedAppException("No se encontró un refresh token.");

        await _authService.RevokeTokenAsync(refreshToken, cancellationToken);
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions { Path = "/api/auth" });
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<MeResponse>> Me(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
        var response = await _authService.GetMeAsync(userId, cancellationToken);
        return Ok(response);
    }

    private void SetRefreshTokenCookie(string refreshToken, DateTime expiresAt)
    {
        Response.Cookies.Append(RefreshTokenCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = !Request.Host.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase),
            SameSite = SameSiteMode.Lax,
            Expires = expiresAt,
            Path = "/api/auth"
        });
    }

    private static object ToBrowserResponse(AuthResponse response) => new
    {
        response.AccessToken,
        response.AccessTokenExpiresAt,
        response.User
    };
}
