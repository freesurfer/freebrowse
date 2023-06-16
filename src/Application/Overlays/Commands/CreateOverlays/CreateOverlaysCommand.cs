using MediatR;

namespace FreeBrowse.Application.Overlays.Commands.CreateOverlays;

public record CreateOverlaysCommand : IRequest<CreateOverlayResponseDto[]>
{
	public int SurfaceId { get; set; }

	public CreateOverlayDto[] Overlays { get; set; } = null!;
}
