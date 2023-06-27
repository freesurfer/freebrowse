using AutoMapper;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Surfaces.Commands.CreateSurfaces;

public class CreateSurfaceCommandHandler : IRequestHandler<CreateSurfacesCommand, CreateSurfaceResponseDto[]>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly IMapper mapper;
	private readonly ILogger<CreateSurfaceCommandHandler> logger;

	public CreateSurfaceCommandHandler(IApplicationDbContext context, IFileStorage fileStorage,IMapper mapper, ILogger<CreateSurfaceCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.mapper = mapper;
		this.logger = logger;
	}

	public async Task<CreateSurfaceResponseDto[]> Handle(CreateSurfacesCommand request, CancellationToken cancellationToken)
	{
		var result = new List<CreateSurfaceResponseDto>();

		using var transaction = await this.context.BeginTransactionAsync(cancellationToken);

		try
		{
			foreach (var s in request.Surfaces)
			{
				var filePath = await this.fileStorage.SaveFileAsync(s.Base64, request.ProjectId, s.FileName);

				var surface = new Surface
				{
					Path = filePath,
					FileName = s.FileName,
					Order = s.Order,
					Color = s.Color,
					Opacity = s.Opacity,
					Visible = s.Visible,
					ProjectId = request.ProjectId
				};

				this.context.Surfaces.Add(surface);

				await this.context.SaveChangesAsync(cancellationToken);

				var responseDto = this.mapper.Map<CreateSurfaceResponseDto>(surface);
				responseDto.FileSize = await this.fileStorage.GetFileSizeAsync(filePath);

				result.Add(responseDto);
			}

			await transaction.CommitAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error creating surfaces");
			await transaction.RollbackAsync(cancellationToken);
			await this.UndoFileCreation(request);
			throw;
		}

		return result.ToArray();
	}

	private async Task UndoFileCreation(CreateSurfacesCommand request)
	{
		foreach (var s in request.Surfaces)
		{
			await this.fileStorage.DeleteFileAsync(request.ProjectId, s.FileName);
		}
	}
}
