namespace FreeBrowse.Application.Surfaces.Commands.CreateSurfaces;

public record SurfaceDto
{
	public string FileName { get; set; } = null!;

	public string Base64 { get; set; } = null!;

	public int Order { get; set; }

	public int Opacity { get; set; }
}
