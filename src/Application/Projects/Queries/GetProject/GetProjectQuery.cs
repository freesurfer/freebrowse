using MediatR;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public record GetProjectQuery : IRequest<ProjectDto>
{
	public int Id { get; set; }
}
