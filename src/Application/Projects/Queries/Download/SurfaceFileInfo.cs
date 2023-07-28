using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Queries.Download;

public record SurfaceFileInfo : FileInfo, IMapFrom<Surface>
{
	public IEnumerable<FileInfo> Overlays { get; init; }

	public IEnumerable<FileInfo> Annotations { get; init; }
}
