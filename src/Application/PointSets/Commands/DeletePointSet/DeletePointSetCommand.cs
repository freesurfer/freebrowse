using MediatR;

namespace FreeBrowse.Application.PointSets.Commands.DeletePointSet;

public record DeletePointSetCommand : IRequest
{
	public int Id { get; set; }
}
