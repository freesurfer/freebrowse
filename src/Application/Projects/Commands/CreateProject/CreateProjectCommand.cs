using MediatR;

namespace FreeBrowse.Application.Projects.Commands.CreateProject;

public record CreateProjectCommand : IRequest<CreateProjectResponseDto>
{
	public string Name { get; set; } = null!;

	public List<VolumeDto> Volumes { get; set; } = new List<VolumeDto>();
	
	public List<SurfaceDto> Surfaces { get; set; } = new List<SurfaceDto>();
}
