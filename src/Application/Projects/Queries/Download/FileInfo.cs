using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Queries.Download;

public record FileInfo : IMapFrom<Overlay>, IMapFrom<Annotation>, IMapFrom<Volume>, IMapFrom<PointSet>
{
	public string FileName { get; init; }

	public string Path { get; init; }
}
