using FluentValidation;

namespace FreeBrowse.Application.Accounts.Queries.GetBearerToken;

public class GetBearerTokenQueryValidator : AbstractValidator<GetBearerTokenQuery>
{
	public GetBearerTokenQueryValidator()
	{
		this.RuleFor(x => x.Username)
			.MinimumLength(3).WithMessage("The username should be at least 3 characters long.")
			.NotEmpty().WithMessage("The username is required.");

		this.RuleFor(x => x.Password)
            .MinimumLength(3).WithMessage("The password should be at least 3 characters long.")
            .NotEmpty().WithMessage("The password is required.");
    }
}
