using MediatR;

namespace FreeBrowse.Application.PointSets.Commands.EditPointSet;

public record EditPointSetCommand : IRequest<EditPointResponseDto>
{
	public int Id { get; set; }

	public string? Base64 { get; set; }
}
