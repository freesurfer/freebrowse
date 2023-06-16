using MediatR;

namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProjectFromBytes;

public record CreateJupyterProjectFromBytesCommand : IRequest<CreateJupyterProjectFromBytesResponseDto>
{
	public FileDto[] Files { get; set; } = null!;
}
