using FreeBrowse.Application.Common.Interfaces;
using MediatR;

namespace FreeBrowse.Application.Accounts.Queries.GetBearerToken;

public record GetBearerTokenQuery : IRequest<string>
{
    public string? Username { get; init; }

    public string? Password { get; init; }
}

internal class GetBearerTokenQueryHandler : IRequestHandler<GetBearerTokenQuery, string>
{
    private readonly IIdentityService identityService;

    public GetBearerTokenQueryHandler(IIdentityService identityService)
    {
        this.identityService = identityService;
    }

    public async Task<string> Handle(GetBearerTokenQuery request, CancellationToken cancellationToken)
	{
        var login = await this.identityService.LoginAsync(request.Username!, request.Password!);

        if (!login.Result.Succeeded)
        {
            throw new UnauthorizedAccessException();
        }

        return login.Token!;
	}
}
