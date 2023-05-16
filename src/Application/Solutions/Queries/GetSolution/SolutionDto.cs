using AutoMapper;
using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Solutions.Queries.GetSolution;

public class SolutionDto : IMapFrom<Solution>
{
	public int Id { get; set; }

	public string? Name { get; set; }

	public ICollection<VolumeDto> Volumes { get; set; } = new List<VolumeDto>();

	public ICollection<SurfaceDto> Surfaces { get; set; } = new List<SurfaceDto>();
}
