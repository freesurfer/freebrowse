using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public record SurfaceDto : IMapFrom<Surface>
{
	public string? Path { get; set; }

	public string? FileName { get; set; }

	public int Order { get; set; }

	public int Opacity { get; set; }
}
