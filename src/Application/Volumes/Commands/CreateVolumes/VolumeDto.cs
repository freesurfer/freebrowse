namespace FreeBrowse.Application.Volumes.Commands.CreateVolumes;

public record VolumeDto
{
	public string FileName { get; set; } = null!;

	public string Base64 { get; set; } = null!;

	public int Order { get; set; }

	public int Opacity { get; set; }

	public int ContrastMin { get; set; }

	public int ContrastMax { get; set; }
}
