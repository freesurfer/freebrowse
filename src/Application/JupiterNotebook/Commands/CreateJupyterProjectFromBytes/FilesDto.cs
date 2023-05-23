namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProjectFromBytes;

public record FilesDto
{
	public string FileName { get; set; } = null!;

	public byte[] FileData { get; set; } = null!;
}
