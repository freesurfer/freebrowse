using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Volumes.Commands.CreateVolumes;

public class CreateVolumeCommandHandler : IRequestHandler<CreateVolumesCommand, CreateVolumeResponseDto[]>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly ILogger<CreateVolumeCommandHandler> logger;

	public CreateVolumeCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, ILogger<CreateVolumeCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.logger = logger;
	}

	public async Task<CreateVolumeResponseDto[]> Handle(CreateVolumesCommand request, CancellationToken cancellationToken)
	{
		var result = new List<CreateVolumeResponseDto>();

		using var transaction = await this.context.BeginTransactionAsync(cancellationToken);

		try
		{
			foreach (var v in request.Volumes)
			{
				var filePath = await this.fileStorage.SaveFileAsync(v.Base64, request.SolutionId, v.FileName);

				var volume = new Volume
				{
					Path = filePath,
					FileName = v.FileName,
					Order = v.Order,
					Opacity = v.Opacity,
					ContrastMax = v.ContrastMax,
					ContrastMin = v.ContrastMin,
					SolutionId = request.SolutionId
				};

				this.context.Volumes.Add(volume);

				await this.context.SaveChangesAsync(cancellationToken);

				var responseDto = new CreateVolumeResponseDto
				{
					Id = volume.Id,
					FileName = volume.FileName
				};

				result.Add(responseDto);
			}

			await transaction.CommitAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error creating volumes");
			await transaction.RollbackAsync(cancellationToken);
			await this.UndoFileCreation(request);
			throw;
		}

		return result.ToArray();
	}

	private async Task UndoFileCreation(CreateVolumesCommand request)
	{
		foreach (var v in request.Volumes)
		{
			await this.fileStorage.DeleteFileAsync(request.SolutionId, v.FileName);
		}
	}
}
