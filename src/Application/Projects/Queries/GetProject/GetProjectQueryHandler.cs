using AutoMapper;
using AutoMapper.QueryableExtensions;
using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public class GetProjectQueryHandler : IRequestHandler<GetProjectQuery, GetProjectDto>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly IMapper mapper;

	public GetProjectQueryHandler(IApplicationDbContext context, IFileStorage fileStorage, IMapper mapper)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.mapper = mapper;
	}

	public async Task<GetProjectDto> Handle(GetProjectQuery request, CancellationToken cancellationToken)
	{
		var projectDto = await this.context.Projects
			.Include(s => s.Volumes)
			.Include(s => s.Surfaces)
				.ThenInclude(s => s.Overlays)
			.Include(s => s.Surfaces)
				.ThenInclude(s => s.Annotations)
			.Include(s => s.PointSets)
			.ProjectTo<GetProjectDto>(this.mapper.ConfigurationProvider)
			.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (projectDto == null)
		{
			throw new NotFoundException(nameof(Project), request.Id);
		}

		foreach (var volumeDto in projectDto.Volumes)
		{
			volumeDto.FileSize = await this.fileStorage.GetFileSizeAsync(volumeDto.Path);
		}

		foreach (var surfaceDto in projectDto.Surfaces)
		{
			surfaceDto.FileSize = await this.fileStorage.GetFileSizeAsync(surfaceDto.Path);

			foreach (var overlayDto in surfaceDto.Overlays)
			{
				overlayDto.FileSize = await this.fileStorage.GetFileSizeAsync(overlayDto.Path);
			}

			foreach (var annotationDto in surfaceDto.Annotations)
			{
				annotationDto.FileSize = await this.fileStorage.GetFileSizeAsync(annotationDto.Path);
			}
		}

		foreach (var pointSetDto in projectDto.PointSets)
		{
			pointSetDto.FileSize = await this.fileStorage.GetFileSizeAsync(pointSetDto.Path);
		}

		return projectDto;
	}
}
