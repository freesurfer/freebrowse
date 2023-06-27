using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Annotations.Queries.GetAnnotation;

public class GetAnnotationQueryHandler : IRequestHandler<GetAnnotationQuery, FileContentResult>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;

	public GetAnnotationQueryHandler(IApplicationDbContext context, IFileStorage fileStorage)
	{
		this.context = context;
		this.fileStorage = fileStorage;
	}

	public async Task<FileContentResult> Handle(GetAnnotationQuery request, CancellationToken cancellationToken)
	{
		var annotation = await this.context.Annotations.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (annotation == null)
		{
			throw new NotFoundException(nameof(Annotation), request.Id);
		}

		var contentType = ContentTypeHelper.GetContentType(annotation.FileName);

		var fileBytes = await this.fileStorage.GetFileBytesAsync(annotation.Path);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = annotation.FileName,
			EnableRangeProcessing = true,
		};

		return result;
	}
}
