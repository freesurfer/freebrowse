using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Overlays.Commands.DeleteOverlay;

public class DeleteOverlayCommandHandler : IRequestHandler<DeleteOverlayCommand>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<DeleteOverlayCommandHandler> logger;

	public DeleteOverlayCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<DeleteOverlayCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<Unit> Handle(DeleteOverlayCommand request, CancellationToken cancellationToken)
	{
		var overlay = await this.context.Overlays.FindAsync(request.Id);

		if (overlay == null)
		{
			throw new NotFoundException(nameof(Overlay), request.Id);
		}

		this.context.Overlays.Remove(overlay);

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error deleting overlay");
			throw;
		}

		var surfaceProjectId = this.context.Surfaces.Where(s => s.Id == overlay.SurfaceId).Select(s => s.ProjectId).FirstOrDefault();

		await this.fileStorage.DeleteFileAsync(surfaceProjectId, overlay.FileName);

		return Unit.Value;
	}
}
