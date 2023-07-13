using MediatR;

namespace FreeBrowse.Application.PointSets.Commands.EditPointSet;

public record EditPointSetCommand : IRequest<EditPointResponseDto>
{
	public int Id { get; set; }

	public string? Base64 { get; set; }

	public int? Order { get; set; }

	public int? Opacity { get; set; }

	public bool? Visible { get; set; }
}
