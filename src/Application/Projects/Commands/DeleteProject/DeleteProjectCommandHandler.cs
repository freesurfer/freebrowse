using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Projects.Commands.DeleteProject;

public class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<DeleteProjectCommandHandler> logger;

	public DeleteProjectCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<DeleteProjectCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<Unit> Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
	{
		var project = await this.context.Projects.FindAsync(request.Id);

		if (project == null)
		{
			throw new NotFoundException(nameof(Project), request.Id);
		}

		this.context.Projects.Remove(project);

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error deleting project");
			throw;
		}

		this.fileStorage.DeleteDirectory(project.Id);

		return Unit.Value;
	}
}
