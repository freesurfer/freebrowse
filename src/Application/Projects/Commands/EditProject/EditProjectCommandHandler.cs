using AutoMapper;
using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Projects.Commands.EditProject;

public class EditProjectCommandHandler : IRequestHandler<EditProjectCommand, EditProjectResponseDto>
{
	private readonly IApplicationDbContext context;
	private readonly IMapper mapper;
	private readonly ILogger<EditProjectCommandHandler> logger;

	public EditProjectCommandHandler(IApplicationDbContext context,IMapper mapper, ILogger<EditProjectCommandHandler> logger)
	{
		this.context = context;
		this.mapper = mapper;
		this.logger = logger;
	}

	public async Task<EditProjectResponseDto> Handle(EditProjectCommand request, CancellationToken cancellationToken)
	{
		var project = await this.context.Projects.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

		if (project == null)
		{
			throw new NotFoundException(nameof(Project), request.Id);
		}

		project.Name = request.Name;
		project.MeshThicknessOn2D = request.MeshThicknessOn2D;

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error updating project");
			throw;
		}

		var result = this.mapper.Map<EditProjectResponseDto>(project);

		return result;
	}
}
