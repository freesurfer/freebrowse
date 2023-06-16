namespace FreeBrowse.Application.Projects.Commands.CreateProject;

public record CreateProjectVolumeDto
{
	public string Base64 { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public int Order { get; set; }

	public string? ColorMap { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public int ContrastMin { get; set; }

	public int ContrastMax { get; set; }
}
