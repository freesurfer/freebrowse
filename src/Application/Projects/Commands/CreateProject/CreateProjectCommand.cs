using MediatR;

namespace FreeBrowse.Application.Projects.Commands.CreateProject;

public record CreateProjectCommand : IRequest<CreateProjectResponseDto>
{
	public string Name { get; set; } = null!;

	public double MeshThicknessOn2D { get; set; }

	public List<CreateProjectVolumeDto> Volumes { get; set; } = new List<CreateProjectVolumeDto>();
	
	public List<CreateProjectSurfaceDto> Surfaces { get; set; } = new List<CreateProjectSurfaceDto>();
}
