using System.Collections.Generic;
using AutoMapper;
using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public class GetProjectQueryHandler : IRequestHandler<GetProjectQuery, ProjectDto>
{
	private readonly IApplicationDbContext context;
	private readonly IMapper mapper;

	public GetProjectQueryHandler(IApplicationDbContext context, IMapper mapper)
	{
		this.context = context;
		this.mapper = mapper;
	}

	public async Task<ProjectDto> Handle(GetProjectQuery request, CancellationToken cancellationToken)
	{
		var project = await this.context.Projects
			.Include(s => s.Volumes)
			.Include(s => s.Surfaces)
			.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (project == null)
		{
			throw new NotFoundException(nameof(Project), request.Id);
		}

		return this.mapper.Map<ProjectDto>(project);
	}
}
