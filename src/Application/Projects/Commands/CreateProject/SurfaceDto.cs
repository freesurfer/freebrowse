namespace FreeBrowse.Application.Projects.Commands.CreateProject;

public record SurfaceDto
{
	public string Base64 { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public int Order { get; set; }

	public int Opacity { get; set; }
}
