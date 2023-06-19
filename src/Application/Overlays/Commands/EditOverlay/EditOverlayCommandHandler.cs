using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Overlays.Commands.EditOverlay;

public class EditOverlayCommandHandler : IRequestHandler<EditOverlayCommand, int>
{
	private readonly IApplicationDbContext context;
	private readonly ILogger<EditOverlayCommandHandler> logger;

	public EditOverlayCommandHandler(IApplicationDbContext context, ILogger<EditOverlayCommandHandler> logger)
	{
		this.context = context;
		this.logger = logger;
	}

	public async Task<int> Handle(EditOverlayCommand request, CancellationToken cancellationToken)
	{
		var overlay = await this.context.Overlays.FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);

		if (overlay == null)
		{
			throw new NotFoundException(nameof(Overlay), request.Id);
		}

		if (request.Base64 != null)
		{
			File.WriteAllBytes(overlay.Path, Convert.FromBase64String(request.Base64));
		}

		overlay.Color = request.Color ?? overlay.Color;
		overlay.Opacity = request.Opacity ?? overlay.Opacity;
		overlay.Visible = request.Visible ?? overlay.Visible;

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error updating overlay");
			throw;
		}

		return request.Id;
	}
}
