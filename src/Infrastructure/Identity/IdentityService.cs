using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Application.Common.Models;

namespace FreeBrowse.Infrastructure.Identity;

public class IdentityService : IIdentityService
{
    private readonly UserManager<ApplicationUser> userManager;
	private readonly SignInManager<ApplicationUser> singinManager;
	private readonly IUserClaimsPrincipalFactory<ApplicationUser> userClaimsPrincipalFactory;
    private readonly IAuthorizationService authorizationService;
	private readonly IBearerTokenFactory bearerTokenFactory;

	public IdentityService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> singinManager,
        IUserClaimsPrincipalFactory<ApplicationUser> userClaimsPrincipalFactory,
        IAuthorizationService authorizationService,
        IBearerTokenFactory bearerTokenFactory)
    {
        this.userManager = userManager;
		this.singinManager = singinManager;
		this.userClaimsPrincipalFactory = userClaimsPrincipalFactory;
        this.authorizationService = authorizationService;
		this.bearerTokenFactory = bearerTokenFactory;
	}

    public async Task<(Result Result, string? Token)> LoginAsync(string username, string password)
	{
        var user = await this.userManager.FindByNameAsync(username!);
        if (user == null)
        {
            return (Result.Failure(new[] { "User not found" }), null);
		}

        var signInResult = await this.singinManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: false);
        if (!signInResult.Succeeded)
        {
            return (Result.Failure(new[] { "Wrong password" }), null);
        }

        var token = this.bearerTokenFactory.GenerateToken(username, user.Id);

        return (Result.Success(), token);
    }

    public async Task<string?> GetUserNameAsync(string userId)
    {
        var user = await this.userManager.Users.FirstAsync(u => u.Id == userId);

        return user.UserName;
    }

    public async Task<(Result Result, string UserId)> CreateUserAsync(string userName, string password)
    {
        var user = new ApplicationUser
        {
            UserName = userName,
            Email = userName,
        };

        var result = await this.userManager.CreateAsync(user, password);

        return (result.ToApplicationResult(), user.Id);
    }

    public bool IsUsernameTaken(string username)
    {
        return this.userManager.Users.Any(u => u.UserName == username);
    }

    public async Task<bool> IsInRoleAsync(string userId, string role)
    {
        var user = this.userManager.Users.SingleOrDefault(u => u.Id == userId);

        return user != null && await this.userManager.IsInRoleAsync(user, role);
    }

    public async Task<bool> AuthorizeAsync(string userId, string policyName)
    {
        var user = this.userManager.Users.SingleOrDefault(u => u.Id == userId);

        if (user == null)
        {
            return false;
        }

        var principal = await this.userClaimsPrincipalFactory.CreateAsync(user);

        var result = await this.authorizationService.AuthorizeAsync(principal, policyName);

        return result.Succeeded;
    }

    public async Task<Result> DeleteUserAsync(string userId)
    {
        var user = this.userManager.Users.SingleOrDefault(u => u.Id == userId);

        return user != null ? await this.DeleteUserAsync(user) : Result.Success();
    }

    public async Task<Result> DeleteUserAsync(ApplicationUser user)
    {
        var result = await this.userManager.DeleteAsync(user);

        return result.ToApplicationResult();
    }
}
