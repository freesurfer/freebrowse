using System.IO.Compression;
using AutoMapper;
using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Surfaces.Queries.GetSurface;

public class GetSurfaceQueryHandler : IRequestHandler<GetSurfaceQuery, FileContentResult>
{
	private readonly IApplicationDbContext context;
	private readonly IMapper mapper;

	public GetSurfaceQueryHandler(IApplicationDbContext context, IMapper mapper)
	{
		this.context = context;
		this.mapper = mapper;
	}

	public async Task<FileContentResult> Handle(GetSurfaceQuery request, CancellationToken cancellationToken)
	{
		var surface = await this.context.Surfaces
			.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (surface == null)
		{
			throw new NotFoundException(nameof(Surface), request.Id);
		}
		if (!System.IO.File.Exists(surface.Path))
		{
			throw new NotFoundException($"File was not found at \"{surface.Path}\".");
		}

		var provider = new FileExtensionContentTypeProvider();
		string contentType;
		if (!provider.TryGetContentType(surface.FileName, out contentType))
		{
			contentType = "application/octet-stream";
		}

		// Read the file content
		var fileBytes = System.IO.File.ReadAllBytes(surface.Path);

		// Return the file as a response with gzip content-encoding
		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = surface.FileName,
			EnableRangeProcessing = true,
		};
		return result;
	}
}
