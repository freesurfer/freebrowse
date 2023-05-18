using MediatR;

namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterSolutionFromBytes;

public record CreateJupyterSolutionFromBytesCommand : IRequest<CreateJupyterSolutionFromBytesResponseDto>
{
	public FilesDto[] Files { get; set; } = null!;
}
