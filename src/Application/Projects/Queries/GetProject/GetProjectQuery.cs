using MediatR;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public record GetProjectQuery : IRequest<GetProjectDto>
{
	public int Id { get; set; }
}
