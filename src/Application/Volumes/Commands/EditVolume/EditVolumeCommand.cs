using MediatR;

namespace FreeBrowse.Application.Volumes.Commands.EditVolume;

public record EditVolumeCommand : IRequest<int>
{
	public int Id { get; set; }

	public string? Base64 { get; set; }

	public int? Order { get; set; }

	public string? ColorMap { get; set; }

	public int? Opacity { get; set; }

	public bool? Visible { get; set; }

	public int? ContrastMin { get; set; }

	public int? ContrastMax { get; set; }
}
