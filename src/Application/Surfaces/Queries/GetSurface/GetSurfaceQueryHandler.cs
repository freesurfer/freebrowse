using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Surfaces.Queries.GetSurface;

public class GetSurfaceQueryHandler : IRequestHandler<GetSurfaceQuery, FileContentResult>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;

	public GetSurfaceQueryHandler(IApplicationDbContext context, IFileStorage fileStorage)
	{
		this.context = context;
		this.fileStorage = fileStorage;
	}

	public async Task<FileContentResult> Handle(GetSurfaceQuery request, CancellationToken cancellationToken)
	{
		var surface = await this.context.Surfaces.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (surface == null)
		{
			throw new NotFoundException(nameof(Surface), request.Id);
		}

		var contentType = ContentTypeHelper.GetContentType(surface.FileName);

		var fileBytes = await this.fileStorage.GetFileBytesAsync(surface.Path);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = surface.FileName,
			EnableRangeProcessing = true,
		};

		return result;
	}
}
