namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterSolutionFromBytes;

public record FilesDto
{
	public string FileName { get; set; } = null!;

	public byte[] FileData { get; set; }
}
