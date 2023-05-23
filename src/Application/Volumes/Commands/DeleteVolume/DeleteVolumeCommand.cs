using MediatR;

namespace FreeBrowse.Application.Volumes.Commands.DeleteVolume;

public record DeleteVolumeCommand : IRequest
{
	public int Id { get; set; }
}
