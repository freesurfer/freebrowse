using MediatR;

namespace FreeBrowse.Application.Projects.Commands.EditProject;

public record EditProjectCommand : IRequest<EditProjectResponseDto>
{
	public int Id { get; set; }
	public string Name { get; set; } = null!;
}
