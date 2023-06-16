namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProjectFromBytes;

public record FileDto
{
	public string FileName { get; set; } = null!;

	public byte[] FileData { get; set; } = null!;
}
