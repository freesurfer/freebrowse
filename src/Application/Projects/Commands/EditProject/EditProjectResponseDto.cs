using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Commands.EditProject;

public record EditProjectResponseDto : IMapFrom<Project>
{	
	public int Id { get; set; }

	public string Name { get; set; } = null!;

	public double MeshThicknessOn2D { get; set; }
}
