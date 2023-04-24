using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using MediatR;

namespace FreeBrowse.Application.Accounts.Commands.RegisterAccount;

public record RegisterAccountCommand : IRequest<string>
{
    public string? Username { get; init; }

    public string? Password { get; init; }
}

internal class RegisterAccountCommandHandler : IRequestHandler<RegisterAccountCommand, string>
{
	private readonly IIdentityService identityService;

	public RegisterAccountCommandHandler(IIdentityService identityService)
	{
		this.identityService = identityService;
	}

	public async Task<string> Handle(RegisterAccountCommand request, CancellationToken cancellationToken)
	{
		var registration = await this.identityService.CreateUserAsync(request.Username!, request.Password!);

		if (!registration.Result.Succeeded)
		{
			throw new ValidationException();
		}

		return registration.UserId;
	}
}
