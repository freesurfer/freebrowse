using FluentValidation;

namespace FreeBrowse.Application.Solutions.Commands.EditSolution;

public class EditSolutionCommandValidator : AbstractValidator<EditSolutionCommand>
{
	public EditSolutionCommandValidator()
	{
		this.RuleFor(v => v.Name)
			.MaximumLength(200).WithMessage("Name must not exceed 200 characters.")
			.NotEmpty().WithMessage("Name is required.");
	}
}
