using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Solutions.Commands.CreateSolution;

public class CreateSolutionCommandHandler : IRequestHandler<CreateSolutionCommand, CreateSolutionResponseDto>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<CreateSolutionCommandHandler> logger;

	public CreateSolutionCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<CreateSolutionCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<CreateSolutionResponseDto> Handle(CreateSolutionCommand request, CancellationToken cancellationToken)
	{
		var result = new CreateSolutionResponseDto();

		using var transaction = await this.context.BeginTransactionAsync(cancellationToken);

		try
		{
			var solution = new Solution
			{
				Name = request.Name
			};

			this.context.Solutions.Add(solution);

			await this.context.SaveChangesAsync(cancellationToken);
			result.Id = solution.Id;

			this.fileStorage.CreateDirectory(result.Id);

			var volumes = await this.CreateVolumes(request.Volumes, solution.Id, cancellationToken);
			result.Volumes = volumes.ToArray();

			var surfaces = await this.CreateSurfaces(request.Surfaces, solution.Id, cancellationToken);
			result.Surfaces = surfaces.ToArray();

			await transaction.CommitAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error creating solution");
			this.fileStorage.DeleteDirectory(result.Id);
			await transaction.RollbackAsync(cancellationToken);
			throw;
		}

		return result;
	}

	private async Task<List<VolumeResponseDto>> CreateVolumes(List<VolumeDto> volumes, int solutionId, CancellationToken cancellationToken)
	{
		var result = new List<VolumeResponseDto>();

		foreach (var v in volumes)
		{
			var volume = new Volume
			{
				FileName = v.FileName,
				Order = v.Order,
				Opacity = v.Opacity,
				ContrastMax = v.ContrastMax,
				ContrastMin = v.ContrastMin,
				SolutionId = solutionId
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

	private async Task<List<SurfaceResponseDto>> CreateSurfaces(List<SurfaceDto> surfaces, int  solutionId, CancellationToken cancellationToken)
	{
		var result = new List<SurfaceResponseDto>();

		foreach (var s in surfaces)
		{
			var surface = new Surface
			{
				Path = s.Path,
				Name = s.Name,
				Order = s.Order,
				Opacity = s.Opacity,
				SolutionId = solutionId
			};

			this.context.Surfaces.Add(surface);

			await this.context.SaveChangesAsync(cancellationToken);

			var responseDto = new SurfaceResponseDto
			{
				Id = surface.Id,
				Name = surface.Name
			};

			result.Add(responseDto);
		}

		return result;
	}
}
