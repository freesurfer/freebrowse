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

		this.RuleFor(v => v.ProjectId)
			.MustAsync(this.VolumesBelongToExistingProject)
			.WithMessage("Volume must belong to an existing project.");
		this.RuleFor(v => v.Volumes)
			.NotEmpty().WithMessage("At least one volume must be provided.");
		this.RuleForEach(v => v.Volumes).ChildRules(v =>
		{
			v.RuleFor(v => v.FileName)
				.MaximumLength(200).WithMessage("File name must not exceed 200 characters.")
				.NotEmpty().WithMessage("FileName is required.")
				.Must(this.FileExtensionSupportedForVolumes)
				.WithMessage((file) => $"Invalid file type for: {file.FileName}. Supported file types: {string.Join(", ", ApplicationConstants.AllowedVolumeFileExtensions)}");
		});
	}

	private async Task<bool> VolumesBelongToExistingProject(int projectId, CancellationToken cancellationToken)
	{
		return await this.context.Projects.AnyAsync(s => s.Id == projectId, cancellationToken);
	}

	private bool FileExtensionSupportedForVolumes(string fileName)
	{
		var allowedExtensions = ApplicationConstants.AllowedVolumeFileExtensions.ToArray();

		foreach (var extension in allowedExtensions)
		{
			if (fileName.EndsWith(extension, StringComparison.OrdinalIgnoreCase))
			{
				return true;
			}
		}

		return false;
	}
}
