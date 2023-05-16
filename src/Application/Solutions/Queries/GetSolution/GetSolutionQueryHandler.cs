using System.Collections.Generic;
using AutoMapper;
using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.Solutions.Queries.GetSolution;

public class GetSolutionQueryHandler : IRequestHandler<GetSolutionQuery, SolutionDto>
{
	private readonly IApplicationDbContext context;
	private readonly IMapper mapper;

	public GetSolutionQueryHandler(IApplicationDbContext context, IMapper mapper)
	{
		this.context = context;
		this.mapper = mapper;
	}

	public async Task<SolutionDto> Handle(GetSolutionQuery request, CancellationToken cancellationToken)
	{
		var solution = await this.context.Solutions
			.Include(s => s.Volumes)
			.Include(s => s.Surfaces)
			.FirstOrDefaultAsync(s => s.Id == request.Id);

		if (solution == null)
		{
			throw new NotFoundException(nameof(Solution), request.Id);
		}

		return this.mapper.Map<SolutionDto>(solution);
	}
}
