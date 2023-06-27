using MediatR;

namespace FreeBrowse.Application.PointSets.Commands.CreatePointSet;

public record CreatePointSetCommand : IRequest<CreatePointSetResponseDto>
{
	public string Base64 { get; init; } = null!;

	public string FileName { get; init; } = null!;

	public int ProjectId { get; init; }
}
