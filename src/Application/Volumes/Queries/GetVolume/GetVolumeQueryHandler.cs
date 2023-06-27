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
	private readonly IFileStorage fileStorage;

	public GetVolumeQueryHandler(IApplicationDbContext context, IFileStorage fileStorage)
	{
		this.context = context;
		this.fileStorage = fileStorage;
	}

	public async Task<FileContentResult> Handle(GetVolumeQuery request, CancellationToken cancellationToken)
	{
		var volume = await this.context.Volumes.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (volume == null)
		{
			throw new NotFoundException(nameof(Surface), request.Id);
		}

		var contentType = ContentTypeHelper.GetContentType(volume.FileName);

		var fileBytes = await this.fileStorage.GetFileBytesAsync(volume.Path);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = volume.FileName,
			EnableRangeProcessing = true,
		};

		return result;
	}
}
