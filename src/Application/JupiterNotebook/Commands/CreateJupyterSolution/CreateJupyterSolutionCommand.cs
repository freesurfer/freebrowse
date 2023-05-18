using MediatR;

namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterSolution;

public record CreateJupyterSolutionCommand : IRequest<CreateJupyterSolutionResponseDto>
{
	public FilesDto[] Files { get; set; } = null!;
}
