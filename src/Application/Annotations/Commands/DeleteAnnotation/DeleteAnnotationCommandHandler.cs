using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Annotations.Commands.DeleteAnnotation;

public class DeleteAnnotationCommandHandler : IRequestHandler<DeleteAnnotationCommand>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<DeleteAnnotationCommandHandler> logger;

	public DeleteAnnotationCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<DeleteAnnotationCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<Unit> Handle(DeleteAnnotationCommand request, CancellationToken cancellationToken)
	{
		var annotation = await this.context.Annotations.FindAsync(request.Id);

		if (annotation == null)
		{
			throw new NotFoundException(nameof(Annotation), request.Id);
		}

		this.context.Annotations.Remove(annotation);

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error deleting annotation");
			throw;
		}

		var surfaceProjectId = this.context.Surfaces.Where(s => s.Id == annotation.SurfaceId).Select(s => s.ProjectId).FirstOrDefault();

		await this.fileStorage.DeleteFileAsync(surfaceProjectId, annotation.FileName);

		return Unit.Value;
	}
}
