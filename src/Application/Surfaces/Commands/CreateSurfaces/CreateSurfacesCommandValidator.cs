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

		this.RuleFor(v => v.ProjectId)
			.MustAsync(this.SurfacesBelongToExistingProject)
			.WithMessage("Surface must belong to an existing project.");
		this.RuleFor(v => v.Surfaces)
			.NotEmpty().WithMessage("At least one Surface must be provided.");
		this.RuleForEach(v => v.Surfaces).ChildRules(v =>
		{
			v.RuleFor(v => v.FileName)
				.MaximumLength(200).WithMessage("File name must not exceed 200 characters.")
				.NotEmpty().WithMessage("Name is required.")
				.Must(this.FileExtensionSupportedForSurfaces)
				.WithMessage((file) => $"Invalid file type for: {file.FileName}. Supported file types: {string.Join(", ", ApplicationConstants.AllowedSurfaceFileExtensions)}");
		});
	}

	private async Task<bool> SurfacesBelongToExistingProject(int projectId, CancellationToken cancellationToken)
	{
		return await this.context.Projects.AnyAsync(s => s.Id == projectId, cancellationToken);
	}

	private bool FileExtensionSupportedForSurfaces(string fileName)
	{
		var allowedExtensions = ApplicationConstants.AllowedSurfaceFileExtensions.ToArray();

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
