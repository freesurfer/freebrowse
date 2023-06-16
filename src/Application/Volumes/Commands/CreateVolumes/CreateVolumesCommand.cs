using MediatR;

namespace FreeBrowse.Application.Volumes.Commands.CreateVolumes;

public record CreateVolumesCommand : IRequest<CreateVolumeResponseDto[]>
{
	public int ProjectId { get; set; }

	public CreateVolumeDto[] Volumes { get; set; } = null!;
}
