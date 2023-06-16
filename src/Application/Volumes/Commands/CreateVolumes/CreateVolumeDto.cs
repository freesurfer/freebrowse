namespace FreeBrowse.Application.Volumes.Commands.CreateVolumes;

public record CreateVolumeDto
{
	public string FileName { get; set; } = null!;

	public string Base64 { get; set; } = null!;

	public int Order { get; set; }

	public string? ColorMap { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public int ContrastMin { get; set; }

	public int ContrastMax { get; set; }
}
