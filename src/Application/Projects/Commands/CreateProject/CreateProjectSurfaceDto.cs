namespace FreeBrowse.Application.Projects.Commands.CreateProject;

public record CreateProjectSurfaceDto
{
	public string Base64 { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public int Order { get; set; }

	public string? Color { get; set; }

	public bool Visible { get; set; }

	public int Opacity { get; set; }
}
