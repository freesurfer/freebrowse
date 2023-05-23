namespace FreeBrowse.Application.Projects.Commands.CreateProject;
public record CreateProjectResponseDto
{	
	public int Id { get; set; }
	public VolumeResponseDto[] Volumes { get; set; } = null!;
	public SurfaceResponseDto[] Surfaces { get; set; } = null!;
}

public record VolumeResponseDto
{
	public int Id { get; set; }
	public string FileName { get; set; } = null!;
}

public record SurfaceResponseDto
{
	public int Id { get; set; }
	public string FileName { get; set; } = null!;
}