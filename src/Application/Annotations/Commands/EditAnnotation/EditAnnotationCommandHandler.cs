using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Annotations.Commands.EditAnnotation;

public class EditAnnotationCommandHandler : IRequestHandler<EditAnnotationCommand, int>
{
	private readonly IApplicationDbContext context;
	private readonly ILogger<EditAnnotationCommandHandler> logger;

	public EditAnnotationCommandHandler(IApplicationDbContext context, ILogger<EditAnnotationCommandHandler> logger)
	{
		this.context = context;
		this.logger = logger;
	}

	public async Task<int> Handle(EditAnnotationCommand request, CancellationToken cancellationToken)
	{
		var annotation = await this.context.Annotations.FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);

		if (annotation == null)
		{
			throw new NotFoundException(nameof(Annotation), request.Id);
		}

		if (request.Base64 != null)
		{
			File.WriteAllBytes(annotation.Path, Convert.FromBase64String(request.Base64));
		}

		annotation.Color = request.Color ?? annotation.Color;
		annotation.Opacity = request.Opacity ?? annotation.Opacity;
		annotation.Visible = request.Visible ?? annotation.Visible;

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error updating annotation");
			throw;
		}

		return request.Id;
	}
}
