using FluentValidation;
using FreeBrowse.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Annotations.Commands.CreateAnnotations;

public class  CreateAnnotationsCommandValidator : AbstractValidator<CreateAnnotationsCommand>
{
	private readonly IApplicationDbContext context;

	public CreateAnnotationsCommandValidator(IApplicationDbContext context)
	{
		this.context = context;

		this.RuleFor(v => v.SurfaceId)
			.MustAsync(this.AnnotationBelongToExistingSurface)
			.WithMessage("Annotation must belong to an existing surface.");
		this.RuleForEach(v => v.Annotations).ChildRules(v =>
		{
			v.RuleFor(v => v.FileName)
				.MaximumLength(200).WithMessage("File name must not exceed 200 characters.")
				.NotEmpty().WithMessage("Name is required.")
				.Must(this.FileExtensionSupportedForSurfaces)
				.WithMessage((file) => $"Invalid file type for: {file.FileName}. Supported file types: {string.Join(", ", ApplicationConstants.AllowedSurfaceFileExtensions)}");
		});
	}

	private async Task<bool> AnnotationBelongToExistingSurface(int surfaceId, CancellationToken cancellationToken)
	{
		return await this.context.Surfaces.AnyAsync(s => s.Id == surfaceId, cancellationToken);
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
