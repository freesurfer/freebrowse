namespace FreeBrowse.Application.Volumes.Commands.CreateVolumes;

public record CreateVolumeResponseDto
{
	public int Id { get; set; }

	public string FileName { get; set; } = null!;

	public long FileSize { get; set; }
}
