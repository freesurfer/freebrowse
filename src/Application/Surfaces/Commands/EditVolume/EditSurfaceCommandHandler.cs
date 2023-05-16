using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Surfaces.Commands.EditSurface;

public class EditSurfaceCommandHandler : IRequestHandler<EditSurfaceCommand, int>
{
	private readonly IApplicationDbContext context;
	private readonly ILogger<EditSurfaceCommandHandler> logger;

	public EditSurfaceCommandHandler(IApplicationDbContext context, ILogger<EditSurfaceCommandHandler> logger)
	{
		this.context = context;
		this.logger = logger;
	}

	public async Task<int> Handle(EditSurfaceCommand request, CancellationToken cancellationToken)
	{
		var surface = await this.context.Surfaces.SingleOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

		if(surface == null)
		{
			throw new NotFoundException(nameof(Surface), request.Id);
		}

		surface.Order = request.Order;
		surface.Opacity = request.Opacity;

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error updating surface");
			throw;
		}

		return request.Id;
	}
}
