namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProject;

public record Base64Dto
{
	public string FileName { get; set; } = null!;

	public string Base64 { get; set; } = null!;
}
