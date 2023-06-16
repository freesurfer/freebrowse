namespace FreeBrowse.Application.Overlays.Commands.CreateOverlays;

public class CreateOverlayDto
{
	public string FileName { get; set; } = null!;

	public string Base64 { get; set; } = null!;

	public string? Color { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }
}
