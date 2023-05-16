using MediatR;

namespace FreeBrowse.Application.Surfaces.Commands.CreateSurfaces;

public record CreateSurfacesCommand : IRequest<CreateSurfaceResponseDto[]>
{
	public int SolutionId { get; set; }

	public SurfaceDto[] Surfaces { get; set; } = null!;
}
