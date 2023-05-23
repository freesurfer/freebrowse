namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProject;

public record FilesDto
{
	public string FileName { get; set; } = null!;

	public string Base64 { get; set; } = null!;
}
