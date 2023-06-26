using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.PointSets.Queries.GetPointSet;

public class GetPointSetQueryHandler : IRequestHandler<GetPointSetQuery, FileContentResult>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;

	public GetPointSetQueryHandler(IApplicationDbContext context, IFileStorage fileStorage)
	{
		this.context = context;
		this.fileStorage = fileStorage;
	}

	public async Task<FileContentResult> Handle(GetPointSetQuery request, CancellationToken cancellationToken)
	{
		var pointSet = await this.context.PointSets.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (pointSet == null)
		{
			throw new NotFoundException(nameof(Surface), request.Id);
		}

		var contentType = ContentTypeHelper.GetContentType(pointSet.FileName);

		var fileBytes = await this.fileStorage.GetFileBytesAsync(pointSet.Path);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = pointSet.FileName,
			EnableRangeProcessing = true,
		};

		return result;
	}
}
