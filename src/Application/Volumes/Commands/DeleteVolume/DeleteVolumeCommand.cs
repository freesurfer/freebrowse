using MediatR;

namespace FreeBrowse.Application.Volumes.Commands.DeleteVolume;

public class DeleteVolumeCommand : IRequest
{
	public int Id { get; set; }
}
