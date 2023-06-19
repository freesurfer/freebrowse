namespace FreeBrowse.Domain.Entities;

public class Overlay : BaseAuditableEntity
{
	public string Path { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public string? Color { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public int SurfaceId { get; set; }

	public Surface Surface { get; set; } = null!;
}
