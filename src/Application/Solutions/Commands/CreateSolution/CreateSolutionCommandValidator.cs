using FluentValidation;

namespace FreeBrowse.Application.Solutions.Commands.CreateSolution;

public class CreateSolutionCommandValidator : AbstractValidator<CreateSolutionCommand>
{
	public CreateSolutionCommandValidator()
	{
		this.RuleFor(v => v.Name)
			.MaximumLength(200).WithMessage("Name must not exceed 200 characters.")
			.NotEmpty().WithMessage("Name is required.");
		this.RuleForEach(v => v.Surfaces).ChildRules(v =>
		{
			v.RuleFor(v => v.Name)
				.NotEmpty().WithMessage("Name is required.");
		});
		this.RuleForEach(v => v.Volumes).ChildRules(v =>
		{
			v.RuleFor(v => v.FileName)
				.NotEmpty().WithMessage("FileName is required.");
		});
	}
}
