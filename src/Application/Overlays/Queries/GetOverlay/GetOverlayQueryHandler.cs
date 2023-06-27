using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Overlays.Queries.GetOverlay;

public class GetOverlayQueryHandler : IRequestHandler<GetOverlayQuery, FileContentResult>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;

	public GetOverlayQueryHandler(IApplicationDbContext context, IFileStorage fileStorage)
	{
		this.context = context;
		this.fileStorage = fileStorage;
	}

	public async Task<FileContentResult> Handle(GetOverlayQuery request, CancellationToken cancellationToken)
	{
		var overlay = await this.context.Overlays.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (overlay == null)
		{
			throw new NotFoundException(nameof(Overlay), request.Id);
		}

		var contentType = ContentTypeHelper.GetContentType(overlay.FileName);

		var fileBytes = await this.fileStorage.GetFileBytesAsync(overlay.Path);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = overlay.FileName,
			EnableRangeProcessing = true,
		};

		return result;
	}
}
