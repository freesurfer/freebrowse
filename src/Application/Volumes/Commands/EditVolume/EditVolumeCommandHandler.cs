using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Volumes.Commands.EditVolume;

public class EditVolumeCommandHandler : IRequestHandler<EditVolumeCommand, int>
{
	private readonly IApplicationDbContext context;
	private readonly ILogger<EditVolumeCommandHandler> logger;

	public EditVolumeCommandHandler(IApplicationDbContext context, ILogger<EditVolumeCommandHandler> logger)
	{
		this.context = context;
		this.logger = logger;
	}

	public async Task<int> Handle(EditVolumeCommand request, CancellationToken cancellationToken)
	{
		var volume = await this.context.Volumes.SingleOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

		if(volume == null)
		{
			throw new NotFoundException(nameof(Volume), request.Id);
		}

		volume.Opacity = request.Opacity;
		volume.ContrastMax = request.ContrastMax;
		volume.ContrastMin = request.ContrastMin;

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error updating volume");
			throw;
		}

		return request.Id;
	}
}
