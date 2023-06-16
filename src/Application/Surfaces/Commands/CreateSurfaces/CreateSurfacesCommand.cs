using MediatR;

namespace FreeBrowse.Application.Surfaces.Commands.CreateSurfaces;

public record CreateSurfacesCommand : IRequest<CreateSurfaceResponseDto[]>
{
	public int ProjectId { get; set; }

	public CreateSurfaceDto[] Surfaces { get; set; } = null!;
}
