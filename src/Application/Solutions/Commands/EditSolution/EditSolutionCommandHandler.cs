using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Solutions.Commands.EditSolution;

public class EditSolutionCommandHandler : IRequestHandler<EditSolutionCommand, EditSolutionResponseDto>
{
	private readonly IApplicationDbContext context;
	private readonly ILogger<EditSolutionCommandHandler> logger;

	public EditSolutionCommandHandler(IApplicationDbContext context, ILogger<EditSolutionCommandHandler> logger)
	{
		this.context = context;
		this.logger = logger;
	}

	public async Task<EditSolutionResponseDto> Handle(EditSolutionCommand request, CancellationToken cancellationToken)
	{
		var solution = await this.context.Solutions.SingleOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

		if (solution == null)
		{
			throw new NotFoundException(nameof(Solution), request.Id);
		}

		solution.Name = request.Name;

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error updating solution");
			throw;
		}

		var result = new EditSolutionResponseDto
		{
			Id = solution.Id,
			Name = solution.Name
		};

		return result;
	}
}
