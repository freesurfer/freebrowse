using MediatR;

namespace FreeBrowse.Application.Surfaces.Commands.DeleteSurface;

public class DeleteSurfaceCommand : IRequest
{
	public int Id { get; set; }
}
