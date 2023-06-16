using AutoMapper;
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

	public GetSurfaceQueryHandler(IApplicationDbContext context, IMapper mapper)
	{
		this.context = context;
	}

	public async Task<FileContentResult> Handle(GetSurfaceQuery request, CancellationToken cancellationToken)
	{
		var surface = await this.context.Surfaces.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (surface == null)
		{
			throw new NotFoundException(nameof(Surface), request.Id);
		}

		if (!File.Exists(surface.Path))
		{
			throw new NotFoundException($"File was not found at \"{surface.Path}\".");
		}

		var contentType = ContentTypeHelper.GetContentType(surface.FileName);

		var fileBytes = File.ReadAllBytes(surface.Path);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = surface.FileName,
			EnableRangeProcessing = true,
		};
		return result;
	}
}
