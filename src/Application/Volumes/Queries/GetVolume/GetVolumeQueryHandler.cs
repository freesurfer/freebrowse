using AutoMapper;
using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Volumes.Queries.GetVolume;

public class GetVolumeQueryHandler : IRequestHandler<GetVolumeQuery, FileContentResult>
{
	private readonly IApplicationDbContext context;
	private readonly IMapper mapper;

	public GetVolumeQueryHandler(IApplicationDbContext context, IMapper mapper)
	{
		this.context = context;
		this.mapper = mapper;
	}

	public async Task<FileContentResult> Handle(GetVolumeQuery request, CancellationToken cancellationToken)
	{
		var volume = await this.context.Volumes.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (volume == null)
		{
			throw new NotFoundException(nameof(Surface), request.Id);
		}

		if (!File.Exists(volume.Path))
		{
			throw new NotFoundException($"File was not found at \"{volume.Path}\".");
		}

		var contentType = ContentTypeHelper.GetContentType(volume.FileName);

		var fileBytes = File.ReadAllBytes(volume.Path);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = volume.FileName,
			EnableRangeProcessing = true,
		};
		return result;
	}
}
