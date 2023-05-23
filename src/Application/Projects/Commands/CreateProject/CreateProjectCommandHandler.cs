using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Projects.Commands.CreateProject;

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, CreateProjectResponseDto>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<CreateProjectCommandHandler> logger;

	public CreateProjectCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<CreateProjectCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<CreateProjectResponseDto> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
	{
		var result = new CreateProjectResponseDto();

		using var transaction = await this.context.BeginTransactionAsync(cancellationToken);

		try
		{
			var project = new Project
			{
				Name = request.Name
			};

			this.context.Projects.Add(project);

			await this.context.SaveChangesAsync(cancellationToken);
			result.Id = project.Id;

			this.fileStorage.CreateDirectory(result.Id);

			var volumes = await this.CreateVolumes(request.Volumes, project.Id, cancellationToken);
			result.Volumes = volumes.ToArray();

			var surfaces = await this.CreateSurfaces(request.Surfaces, project.Id, cancellationToken);
			result.Surfaces = surfaces.ToArray();

			await transaction.CommitAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error creating project");
			this.fileStorage.DeleteDirectory(result.Id);
			await transaction.RollbackAsync(cancellationToken);
			throw;
		}

		return result;
	}

	private async Task<List<VolumeResponseDto>> CreateVolumes(List<VolumeDto> volumes, int projectId, CancellationToken cancellationToken)
	{
		var result = new List<VolumeResponseDto>();

		foreach (var v in volumes)
		{
			var filePath = await this.fileStorage.SaveFileAsync(v.Base64, projectId, v.FileName);

			var volume = new Volume
			{
				Path = filePath,
				FileName = v.FileName,
				Order = v.Order,
				Opacity = v.Opacity,
				ContrastMax = v.ContrastMax,
				ContrastMin = v.ContrastMin,
				ProjectId = projectId
			};

			this.context.Volumes.Add(volume);

			await this.context.SaveChangesAsync(cancellationToken);

			var responseDto = new VolumeResponseDto
			{
				Id = volume.Id,
				FileName = volume.FileName
			};

			result.Add(responseDto);
		}

		return result;
	}

	private async Task<List<SurfaceResponseDto>> CreateSurfaces(List<SurfaceDto> surfaces, int  projectId, CancellationToken cancellationToken)
	{
		var result = new List<SurfaceResponseDto>();

		foreach (var s in surfaces)
		{
			var filePath = await this.fileStorage.SaveFileAsync(s.Base64, projectId, s.FileName);

			var surface = new Surface
			{
				Path = filePath,
				FileName = s.FileName,
				Order = s.Order,
				Opacity = s.Opacity,
				ProjectId = projectId
			};

			this.context.Surfaces.Add(surface);

			await this.context.SaveChangesAsync(cancellationToken);

			var responseDto = new SurfaceResponseDto
			{
				Id = surface.Id,
				FileName = surface.FileName
			};

			result.Add(responseDto);
		}

		return result;
	}
}
