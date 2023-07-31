using System.IO.Compression;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Application.Volumes.Queries.GetVolume;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Projects.Queries.Download;

public class DownloadProjectQueryHandler : IRequestHandler<DownloadProjectQuery, FileContentResult>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly IMapper mapper;

	public DownloadProjectQueryHandler(IApplicationDbContext context, IFileStorage fileStorage, IMapper mapper)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.mapper = mapper;
	}

	public async Task<FileContentResult> Handle(DownloadProjectQuery request, CancellationToken cancellationToken)
	{
		var project = await this.context.Projects
			.Where(p => p.Id == request.Id)
			.ProjectTo<ProjectInfo>(this.mapper.ConfigurationProvider)
			.FirstOrDefaultAsync();

		if (project == null)
		{
			throw new NotFoundException(nameof(Surface), request.Id);
		}

		var fileBytes = await this.CreateArchiveAsync(project);
		var fileName = $"{project.Name}.zip";
		var contentType = ContentTypeHelper.GetContentType(fileName);

		var result = new FileContentResult(fileBytes, contentType)
		{
			FileDownloadName = fileName,
			EnableRangeProcessing = true,
		};

		return result;
	}

	private async Task<byte[]> CreateArchiveAsync(ProjectInfo project)
	{
		using (var archiveStream = new MemoryStream())
		{
			using (var archive = new ZipArchive(archiveStream, ZipArchiveMode.Create, true))
			{

				foreach (var file in project.Volumes)
				{
					await this.AddFileToArchive(archive, file);
				}

				foreach (var file in project.Surfaces)
				{
					await this.AddFileToArchive(archive, file);

					foreach (var overlay in file.Overlays)
					{
						await this.AddFileToArchive(archive, overlay);
					}

					foreach (var annotation in file.Annotations)
					{
						await this.AddFileToArchive(archive, annotation);
					}
				}

				foreach (var file in project.PointSets)
				{
					await this.AddFileToArchive(archive, file);
				}
			}

			return archiveStream.ToArray();
		}	
	}

	private async Task AddFileToArchive(ZipArchive archive, FileInfo file)
	{
		var zipArchiveEntry = archive.CreateEntry(file.FileName, CompressionLevel.Fastest);
		var content = await this.fileStorage.GetFileBytesAsync(file.Path);

		using var zipStream = zipArchiveEntry.Open();
		zipStream.Write(content, 0, content.Length);		
	}
}
