using MediatR;

namespace FreeBrowse.Application.Surfaces.Commands.EditSurface;

public record EditSurfaceCommand : IRequest<int>
{
	public int Id { get; set; }

	public int Order { get; set; }

	public int Opacity { get; set; }
}
