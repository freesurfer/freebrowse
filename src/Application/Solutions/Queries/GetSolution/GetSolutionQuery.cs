using MediatR;

namespace FreeBrowse.Application.Solutions.Queries.GetSolution;

public record class GetSolutionQuery : IRequest<SolutionDto>
{
	public int Id { get; set; }
}
