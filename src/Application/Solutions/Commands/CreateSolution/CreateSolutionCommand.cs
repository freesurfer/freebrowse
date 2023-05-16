using MediatR;

namespace FreeBrowse.Application.Solutions.Commands.CreateSolution;

public record CreateSolutionCommand : IRequest<CreateSolutionResponseDto>
{
	public string Name { get; set; } = null!;

	public List<VolumeDto> Volumes { get; set; } = new List<VolumeDto>();
	
	public List<SurfaceDto> Surfaces { get; set; } = new List<SurfaceDto>();
}
