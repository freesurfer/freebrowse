using MediatR;

namespace FreeBrowse.Application.Surfaces.Commands.DeleteSurface;

public record DeleteSurfaceCommand : IRequest
{
	public int Id { get; set; }
}
