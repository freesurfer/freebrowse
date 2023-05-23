using FluentValidation;

namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProjectFromBytes;

public class CreateJupyterProjectFromBytesValidator : AbstractValidator<CreateJupyterProjectFromBytesCommand>
{
	public CreateJupyterProjectFromBytesValidator()
	{
		this.RuleForEach(f => f.Files).ChildRules(n => n.RuleFor(v => v.FileName)
				.NotEmpty().WithMessage("FileName is required.")
				.Must(this.FileExtensionSupported)
				.WithMessage((file) => $"Invalid file type for: {file.FileName}. Supported file types: {string.Join(", ", ApplicationConstants.AllowedVolumeFileExtensions.Concat(ApplicationConstants.AllowedSurfaceFileExtensions))}"));
	}

	private bool FileExtensionSupported(string fileName)
	{
		var allowedExtensions = ApplicationConstants.AllowedVolumeFileExtensions.Concat(ApplicationConstants.AllowedSurfaceFileExtensions).ToArray();

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
