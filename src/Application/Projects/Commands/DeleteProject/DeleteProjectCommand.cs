using MediatR;

namespace FreeBrowse.Application.Projects.Commands.DeleteProject;

public record DeleteProjectCommand : IRequest
{
	public int Id { get; set; }
}
