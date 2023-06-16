using AutoMapper;
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

	public GetOverlayQueryHandler(IApplicationDbContext context, IMapper mapper)
	{
		this.context = context;
	}

	public async Task<FileContentResult> Handle(GetOverlayQuery request, CancellationToken cancellationToken)
	{
		var overlay = await this.context.Overlays.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (overlay == null)
		{
			throw new NotFoundException(nameof(Overlay), request.Id);
		}

		if (!File.Exists(overlay.Path))
		{
			throw new NotFoundException($"File was not found at \"{overlay.Path}\".");
		}

		var contentType = ContentTypeHelper.GetContentType(overlay.FileName);

		var fileBytes = File.ReadAllBytes(overlay.Path);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = overlay.FileName,
			EnableRangeProcessing = true,
		};
		return result;
	}
}
