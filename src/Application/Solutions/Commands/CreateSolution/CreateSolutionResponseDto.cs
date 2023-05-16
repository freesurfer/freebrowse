namespace FreeBrowse.Application.Solutions.Commands.CreateSolution;
public class CreateSolutionResponseDto
{	
	public int Id { get; set; }
	public VolumeResponseDto[] Volumes { get; set; } = null!;
	public SurfaceResponseDto[] Surfaces { get; set; } = null!;
}

public class VolumeResponseDto
{
	public int Id { get; set; }
	public string FileName { get; set; } = null!;
}

public class SurfaceResponseDto
{
	public int Id { get; set; }
	public string Name { get; set; } = null!;
}