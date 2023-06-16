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
		var volume = await this.context.Volumes.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

		if (volume == null)
		{
			throw new NotFoundException(nameof(Volume), request.Id);
		}

		if (request != null && request.Base64 != null && request.Base64 != volume.Base64)
		{
			volume.Base64 = request.Base64 ?? volume.Base64;
			File.WriteAllBytes(volume.Path, Convert.FromBase64String(request.Base64));
		}

		volume.Order = request.Order ?? volume.Order;
		volume.ColorMap = request.ColorMap ?? volume.ColorMap;
		volume.Opacity = request.Opacity ?? volume.Opacity;
		volume.Visible = request.Visible ?? volume.Visible;
		volume.ContrastMax = request.ContrastMax ?? volume.ContrastMax;
		volume.ContrastMin = request.ContrastMin ?? volume.ContrastMin;

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
