using FluentValidation;

namespace FreeBrowse.Application.Projects.Commands.CreateProject;

public class CreateProjectCommandValidator : AbstractValidator<CreateProjectCommand>
{
	public CreateProjectCommandValidator()
	{
		this.RuleFor(v => v.Name)
			.MaximumLength(200).WithMessage("Name must not exceed 200 characters.")
			.NotEmpty().WithMessage("Name is required.");
		this.RuleFor(v => v.MeshThicknessOn2D)
			.GreaterThanOrEqualTo(0).WithMessage("Mesh thickness must be greater than or equal to 0.")
			.LessThanOrEqualTo(100).WithMessage("Mesh thickness must be less than or equal to 100.");
		this.RuleForEach(v => v.Surfaces).ChildRules(v =>
		{
			v.RuleFor(v => v.FileName)
				.MaximumLength(200).WithMessage("File name must not exceed 200 characters.")
				.NotEmpty().WithMessage("File name is required.")
				.Must(this.FileExtensionSupportedForSurfaces)
				.WithMessage((file) => $"Invalid file type for: {file.FileName}. Supported file types: {string.Join(", ", ApplicationConstants.AllowedSurfaceFileExtensions)}");
		});
		this.RuleForEach(v => v.Volumes).ChildRules(v =>
		{
			v.RuleFor(v => v.FileName)
				.MaximumLength(200).WithMessage("File name must not exceed 200 characters.")
				.NotEmpty().WithMessage("File name is required.")
				.Must(this.FileExtensionSupportedForVolumes)
				.WithMessage((file) => $"Invalid file type for: {file.FileName}. Supported file types: {string.Join(", ", ApplicationConstants.AllowedVolumeFileExtensions)}");
		});
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
