using MediatR;

namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProject;

public record CreateJupyterProjectCommand : IRequest<CreateJupyterProjectResponseDto>
{
	public FilesDto[] Files { get; set; } = null!;
}
