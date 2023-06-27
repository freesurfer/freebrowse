using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.PointSets.Commands.DeletePointSet;

public class DeletePointSetCommandHandler : IRequestHandler<DeletePointSetCommand>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<DeletePointSetCommandHandler> logger;


	public DeletePointSetCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<DeletePointSetCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<Unit> Handle(DeletePointSetCommand request, CancellationToken cancellationToken)
	{
		var pointSet = await this.context.PointSets.FindAsync(request.Id);

		if (pointSet == null)
		{
			throw new NotFoundException(nameof(PointSet), request.Id);
		}

		this.context.PointSets.Remove(pointSet);

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error deleting pointSet");
			throw;
		}

		await this.fileStorage.DeleteFileAsync(pointSet.ProjectId, pointSet.FileName);

		return Unit.Value;
	}
}
