namespace FreeBrowse.Application.Surfaces.Commands.CreateSurfaces;

public record CreateSurfaceDto
{
	public string FileName { get; set; } = null!;

	public string Base64 { get; set; } = null!;

	public int Order { get; set; }

	public string Color { get; set; } = null!;

	public int Opacity { get; set; }

	public bool Visible { get; set; }
}
