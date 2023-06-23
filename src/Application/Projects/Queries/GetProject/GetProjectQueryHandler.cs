﻿using AutoMapper;
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
	private readonly IMapper mapper;

	public GetProjectQueryHandler(IApplicationDbContext context, IMapper mapper)
	{
		this.context = context;
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
			.ProjectTo<GetProjectDto>(this.mapper.ConfigurationProvider)
			.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (projectDto == null)
		{
			throw new NotFoundException(nameof(Project), request.Id);
		}

		foreach (var volumeDto in projectDto.Volumes)
		{
			volumeDto.FileSize = this.CalculateFileSize(volumeDto.Path);
		}

		foreach (var surfaceDto in projectDto.Surfaces)
		{
			surfaceDto.FileSize = this.CalculateFileSize(surfaceDto.Path);
		}

		return projectDto;
	}

	private long CalculateFileSize(string filePath)
	{
		if (!File.Exists(filePath))
		{
			throw new FileNotFoundException("File not found.", filePath);
		}

		return new FileInfo(filePath).Length;
	}
}
