namespace FreeBrowse.Application.Solutions.Commands.CreateSolution;

public record SurfaceDto
{
	public string Path { get; set; } = null!;

	public string Name { get; set; } = null!;

	public int Order { get; set; }

	public int Opacity { get; set; }
}
