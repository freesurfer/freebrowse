using MediatR;

namespace FreeBrowse.Application.Volumes.Commands.EditVolume;

public record EditVolumeCommand : IRequest<int>
{
	public int Id { get; set; }

	public int Opacity { get; set; }

	public int ContrastMin { get; set; }

	public int ContrastMax { get; set; }
}
