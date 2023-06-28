using FluentValidation;
using FreeBrowse.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Overlays.Commands.CreateOverlays;

public class  CreateOverlaysCommandValidator : AbstractValidator<CreateOverlaysCommand>
{
	private readonly IApplicationDbContext context;

	public CreateOverlaysCommandValidator(IApplicationDbContext context)
	{
		this.context = context;

		this.RuleFor(v => v.SurfaceId)
			.MustAsync(this.OverlayBelongToExistingSurface)
			.WithMessage("Overlay must belong to an existing surface.");
		this.RuleForEach(v => v.Overlays).ChildRules(v =>
		{
			v.RuleFor(v => v.FileName)
				.MaximumLength(200).WithMessage("File name must not exceed 200 characters.")
				.NotEmpty().WithMessage("Name is required.");
		});
	}

	private async Task<bool> OverlayBelongToExistingSurface(int surfaceId, CancellationToken cancellationToken)
	{
		return await this.context.Surfaces.AnyAsync(s => s.Id == surfaceId, cancellationToken);
	}
}
