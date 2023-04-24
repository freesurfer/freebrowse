using FluentValidation;
using FreeBrowse.Application.Common.Interfaces;

namespace FreeBrowse.Application.Accounts.Commands.RegisterAccount;

public class RegisterAccountCommandValidator : AbstractValidator<RegisterAccountCommand>
{
	private readonly IIdentityService identityService;

	public RegisterAccountCommandValidator(IIdentityService identityService)
    {
        this.identityService = identityService;

        this.RuleFor(x => x.Username)
			.MinimumLength(3).WithMessage("The username must be longer than 2 characters.")
			.MaximumLength(20).WithMessage("The username must not be longer than 20 characters.")
			.Must(this.NotExist).WithMessage("The username is already taken.")
			.NotEmpty().WithMessage("The username must not be empty.");

        this.RuleFor(x => x.Password)
            .MinimumLength(3).WithMessage("The password must be longer than 2 characters.")
            .MaximumLength(20).WithMessage("The password must not be longer than 20 characters.")
            .NotEmpty().WithMessage("The password must not be empty.");
    }

	private bool NotExist(string username)
	{
		return !this.identityService.IsUsernameTaken(username);
	}
}
