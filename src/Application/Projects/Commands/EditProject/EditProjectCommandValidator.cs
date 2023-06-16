using FluentValidation;

namespace FreeBrowse.Application.Projects.Commands.EditProject;

public class EditProjectCommandValidator : AbstractValidator<EditProjectCommand>
{
	public EditProjectCommandValidator()
	{
		this.RuleFor(v => v.Name)
			.MaximumLength(200).WithMessage("Name must not exceed 200 characters.")
			.NotEmpty().WithMessage("Name is required.");
		this.RuleFor(v => v.MeshThicknessOn2D)
			.GreaterThanOrEqualTo(0).WithMessage("Mesh thickness must be greater than or equal to 0.")
			.LessThanOrEqualTo(100).WithMessage("Mesh thickness must be less than or equal to 100.");
	}
}
