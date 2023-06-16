using MediatR;

namespace FreeBrowse.Application.Surfaces.Commands.EditSurface;

public record EditSurfaceCommand : IRequest<int>
{
	public int Id { get; set; }

	public string? Base64 { get; set; }

	public int? Order { get; set; }

	public string? Color { get; set; }

	public int? Opacity { get; set; }

	public bool? Visible { get; set; }
}
