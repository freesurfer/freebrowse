using AutoMapper;
using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Queries.Download;

public record ProjectInfo : IMapFrom<Project>
{
	public string Name { get; init; }

	public IEnumerable<FileInfo> Volumes { get; init; }

	public IEnumerable<SurfaceFileInfo> Surfaces { get; init; }

	public IEnumerable<FileInfo> PointSets { get; init; }

	public void Mapping(Profile profile)
	{
		profile.CreateMap<Project, ProjectInfo>()
			.ForMember(x => x.Volumes, opt => opt.MapFrom(x => x.Volumes.Where(x => x.Visible)))
			.ForMember(x => x.Surfaces, opt => opt.MapFrom(x => x.Surfaces.Where(x => x.Visible)))
			.ForMember(x => x.PointSets, opt => opt.MapFrom(x => x.PointSets.Where(x => x.Visible)));
	}
}
