namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterSolution;

public record FilesDto
{
	public string FileName { get; set; } = null!;

	public string Base64 { get; set; }
}
