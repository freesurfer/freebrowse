using FluentValidation;

namespace FreeBrowse.Application.Projects.Commands.EditProject;

public class EditProjectCommandValidator : AbstractValidator<EditProjectCommand>
{
	public EditProjectCommandValidator()
	{
		this.RuleFor(v => v.Name)
			.MaximumLength(200).WithMessage("Name must not exceed 200 characters.")
			.NotEmpty().WithMessage("Name is required.");
	}
}
