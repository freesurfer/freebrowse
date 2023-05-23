using MediatR;

namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProjectFromBytes;

public record CreateJupyterProjectFromBytesCommand : IRequest<CreateJupyterProjectFromBytesResponseDto>
{
	public FilesDto[] Files { get; set; } = null!;
}
