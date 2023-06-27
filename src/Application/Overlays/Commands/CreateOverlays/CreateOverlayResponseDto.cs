using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Overlays.Commands.CreateOverlays;

public record CreateOverlayResponseDto : IMapFrom<Overlay>
{
	public int Id { get; set; }

	public string FileName { get; set; } = null!;

	public long FileSize { get; set; }

	public string? Path { get; set; }

	public string? Color { get; set; }

	public string? ColorMap { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public bool Selected { get; set; }
}
