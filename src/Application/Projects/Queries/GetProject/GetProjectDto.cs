using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public record GetProjectDto : IMapFrom<Project>
{
	public int Id { get; set; }

	public string? Name { get; set; }

	public double MeshThicknessOn2D { get; set; }

	public ICollection<GetProjectVolumeDto> Volumes { get; set; } = new List<GetProjectVolumeDto>();

	public ICollection<GetProjectSurfaceDto> Surfaces { get; set; } = new List<GetProjectSurfaceDto>();

	public ICollection<GetProjectPointSetDto> PointSets { get; set; } = new List<GetProjectPointSetDto>();
}
