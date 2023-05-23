namespace FreeBrowse.Application.Surfaces.Commands.CreateSurfaces;

public record CreateSurfaceResponseDto
{
	public int Id { get; set; }
	public string FileName { get; set; } = null!;
}
