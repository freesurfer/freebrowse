using AutoMapper;
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

	public GetAnnotationQueryHandler(IApplicationDbContext context, IMapper mapper)
	{
		this.context = context;
	}

	public async Task<FileContentResult> Handle(GetAnnotationQuery request, CancellationToken cancellationToken)
	{
		var annotation = await this.context.Annotations.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (annotation == null)
		{
			throw new NotFoundException(nameof(Annotation), request.Id);
		}

		if (!File.Exists(annotation.Path))
		{
			throw new NotFoundException($"File was not found at \"{annotation.Path}\".");
		}

		var contentType = ContentTypeHelper.GetContentType(annotation.FileName);

		var fileBytes = File.ReadAllBytes(annotation.Path);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = annotation.FileName,
			EnableRangeProcessing = true,
		};

		return result;
	}
}
