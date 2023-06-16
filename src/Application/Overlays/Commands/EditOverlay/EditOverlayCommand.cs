using MediatR;

namespace FreeBrowse.Application.Overlays.Commands.EditOverlay;

public record EditOverlayCommand : IRequest<int>
{
	public int Id { get; set; }

	public string? Base64 { get; set; }

	public string? Color { get; set; }

	public int? Opacity { get; set; }

	public bool? Visible { get; set; }
}
