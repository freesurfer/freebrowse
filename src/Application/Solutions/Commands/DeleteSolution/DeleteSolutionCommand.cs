using MediatR;

namespace FreeBrowse.Application.Solutions.Commands.DeleteSolution;

public record DeleteSolutionCommand : IRequest
{
	public int Id { get; set; }
}
