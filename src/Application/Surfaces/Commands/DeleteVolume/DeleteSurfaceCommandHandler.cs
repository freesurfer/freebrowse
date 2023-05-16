using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Surfaces.Commands.DeleteSurface;

public class DeleteSurfaceCommandHandler : IRequestHandler<DeleteSurfaceCommand>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<DeleteSurfaceCommandHandler> logger;

	public DeleteSurfaceCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<DeleteSurfaceCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<Unit> Handle(DeleteSurfaceCommand request, CancellationToken cancellationToken)
	{
		var surface = await this.context.Surfaces.FindAsync(request.Id);

		if (surface == null)
		{
			throw new NotFoundException(nameof(Surface), request.Id);
		}

		this.context.Surfaces.Remove(surface);

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error deleting surface");
			throw;
		}

		await this.fileStorage.DeleteFileAsync(surface.SolutionId, surface.Name);

		return Unit.Value;
	}
}
