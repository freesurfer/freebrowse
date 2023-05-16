using MediatR;

namespace FreeBrowse.Application.Solutions.Commands.EditSolution;

public record EditSolutionCommand : IRequest<EditSolutionResponseDto>
{
	public int Id { get; set; }
	public string Name { get; set; } = null!;
}
