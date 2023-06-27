using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.PointSets.Commands.EditPointSet;

public record EditPointResponseDto : IMapFrom<PointSet>
{
	public int Id { get; set; }

	public int ProjectId { get; set; }
}
