using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Volumes.Commands.DeleteVolume;

public class DeleteVolumeCommandHandler : IRequestHandler<DeleteVolumeCommand>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<DeleteVolumeCommandHandler> logger;


	public DeleteVolumeCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<DeleteVolumeCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<Unit> Handle(DeleteVolumeCommand request, CancellationToken cancellationToken)
	{
		var volume = await this.context.Volumes.FindAsync(request.Id);

		if (volume == null)
		{
			throw new NotFoundException(nameof(Volume), request.Id);
		}

		this.context.Volumes.Remove(volume);

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error deleting volume");
			throw;
		}

		await this.fileStorage.DeleteFileAsync(volume.ProjectId, volume.FileName);

		return Unit.Value;
	}
}
