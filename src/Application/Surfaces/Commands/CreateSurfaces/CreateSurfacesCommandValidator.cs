using FluentValidation;
using FreeBrowse.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Surfaces.Commands.CreateSurfaces;

public class CreateSurfacesCommandValidator : AbstractValidator<CreateSurfacesCommand>
{
	private readonly IApplicationDbContext context;

	public CreateSurfacesCommandValidator(IApplicationDbContext context)
	{
		this.context = context;

		this.RuleFor(v => v.SolutionId)
			.MustAsync(this.SurfacesBelongToExistingSolution)
			.WithMessage("Surface must belong to an existing solution.");
		this.RuleFor(v => v.Surfaces)
			.NotEmpty().WithMessage("At least one Surface must be provided.");
		this.RuleForEach(v => v.Surfaces).ChildRules(v =>
		{
			v.RuleFor(v => v.Name)
			 .NotEmpty().WithMessage("Name is required.");
		});
	}

	private async Task<bool> SurfacesBelongToExistingSolution(int solutionId, CancellationToken cancellationToken)
	{
		return await this.context.Solutions.AnyAsync(s => s.Id == solutionId, cancellationToken);
	}
}
