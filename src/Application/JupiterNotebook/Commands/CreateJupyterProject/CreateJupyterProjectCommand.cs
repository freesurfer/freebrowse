using MediatR;

namespace FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProject;

public record CreateJupyterProjectCommand : IRequest<CreateJupyterProjectResponseDto>
{
	public Base64Dto[] Files { get; set; } = null!;
}
