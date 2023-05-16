using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Solutions.Queries.GetSolution;

public class SurfaceDto : IMapFrom<Surface>
{
	public string? Path { get; set; }

	public string? Name { get; set; }

	public int Order { get; set; }

	public int Opacity { get; set; }
}
