using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Solutions.Commands.DeleteSolution;

public class DeleteSolutionCommandHandler : IRequestHandler<DeleteSolutionCommand>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<DeleteSolutionCommandHandler> logger;

	public DeleteSolutionCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<DeleteSolutionCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<Unit> Handle(DeleteSolutionCommand request, CancellationToken cancellationToken)
	{
		var solution = await this.context.Solutions.FindAsync(request.Id);

		if (solution == null)
		{
			throw new NotFoundException(nameof(Solution), request.Id);
		}

		this.context.Solutions.Remove(solution);

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error deleting solution");
			throw;
		}

		this.fileStorage.DeleteDirectory(solution.Id);

		return Unit.Value;
	}
}
