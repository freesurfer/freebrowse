using AutoMapper;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Volumes.Commands.CreateVolumes;

public class CreateVolumeCommandHandler : IRequestHandler<CreateVolumesCommand, CreateVolumeResponseDto[]>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly IMapper mapper;
	private readonly ILogger<CreateVolumeCommandHandler> logger;

	public CreateVolumeCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, IMapper mapper, ILogger<CreateVolumeCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.mapper = mapper;
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
				var filePath = await this.fileStorage.SaveFileAsync(v.Base64, request.ProjectId, v.FileName);

				var volume = new Volume
				{
					Path = filePath,
					FileName = v.FileName,
					Order = v.Order,
					ColorMap = v.ColorMap,
					Opacity = v.Opacity,
					Visible = v.Visible,
					ContrastMax = v.ContrastMax,
					ContrastMin = v.ContrastMin,
					ProjectId = request.ProjectId
				};

				this.context.Volumes.Add(volume);

				await this.context.SaveChangesAsync(cancellationToken);

				var responseDto = this.mapper.Map<CreateVolumeResponseDto>(volume);
				responseDto.FileSize = new FileInfo(filePath).Length;

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
			await this.fileStorage.DeleteFileAsync(request.ProjectId, v.FileName);
		}
	}
}
