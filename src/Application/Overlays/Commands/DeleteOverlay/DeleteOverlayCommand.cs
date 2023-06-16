using MediatR;

namespace FreeBrowse.Application.Overlays.Commands.DeleteOverlay;

public record DeleteOverlayCommand : IRequest
{
	public int Id { get; set; }
}
