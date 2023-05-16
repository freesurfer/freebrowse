using FluentValidation;
using FreeBrowse.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Volumes.Commands.CreateVolumes;

public class CreateVolumesCommandValidator : AbstractValidator<CreateVolumesCommand>
{
	private readonly IApplicationDbContext context;

	public CreateVolumesCommandValidator(IApplicationDbContext context)
	{
		this.context = context;

		this.RuleFor(v => v.SolutionId)
			.MustAsync(this.VolumesBelongToExistingSolution)
			.WithMessage("Volume must belong to an existing solution.");
		this.RuleFor(v => v.Volumes)
			.NotEmpty().WithMessage("At least one volume must be provided.");
		this.RuleForEach(v => v.Volumes).ChildRules(v =>
		{
			v.RuleFor(v => v.FileName)
			 .NotEmpty().WithMessage("FileName is required.");
		});
	}

	private async Task<bool> VolumesBelongToExistingSolution(int solutionId, CancellationToken cancellationToken)
	{
		return await this.context.Solutions.AnyAsync(s => s.Id == solutionId, cancellationToken);
	}
}
