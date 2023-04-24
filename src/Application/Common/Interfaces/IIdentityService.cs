using FreeBrowse.Application.Common.Models;

namespace FreeBrowse.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<(Result Result, string? Token)> LoginAsync(string username, string password);

    Task<string?> GetUserNameAsync(string userId);

    bool IsUsernameTaken(string username);

    Task<bool> IsInRoleAsync(string userId, string role);

    Task<bool> AuthorizeAsync(string userId, string policyName);

    Task<(Result Result, string UserId)> CreateUserAsync(string userName, string password);

    Task<Result> DeleteUserAsync(string userId);
}
