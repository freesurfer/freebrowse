using AutoMapper;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Overlays.Commands.CreateOverlays;

public class CreateOverlaysCommandHandler : IRequestHandler<CreateOverlaysCommand, CreateOverlayResponseDto[]>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly IMapper mapper;
	private readonly ILogger<CreateOverlaysCommandHandler> logger;

	public CreateOverlaysCommandHandler(IApplicationDbContext context, IFileStorage fileStorage,IMapper mapper, ILogger<CreateOverlaysCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.mapper = mapper;
		this.logger = logger;
	}

	public async Task<CreateOverlayResponseDto[]> Handle(CreateOverlaysCommand request, CancellationToken cancellationToken)
	{
		var result = new List<CreateOverlayResponseDto>();

		var surfaceProjectId = this.context.Surfaces.Where(s => s.Id == request.SurfaceId).Select(s => s.ProjectId).FirstOrDefault();

		using var transaction = await this.context.BeginTransactionAsync(cancellationToken);

		try
		{
			foreach (var o in request.Overlays)
			{
				var filePath = await this.fileStorage.SaveFileAsync(o.Base64, surfaceProjectId, o.FileName);

				var overlay = new Overlay
				{
					Path = filePath,
					FileName = o.FileName,
					Color = o.Color,
					ColorMap = o.ColorMap,
					Opacity = o.Opacity,
					Visible = o.Visible,
					Selected = o.Selected,
					SurfaceId = request.SurfaceId
				};

				this.context.Overlays.Add(overlay);

				await this.context.SaveChangesAsync(cancellationToken);

				var responseDto = this.mapper.Map<CreateOverlayResponseDto>(overlay);
				responseDto.FileSize = await this.fileStorage.GetFileSizeAsync(filePath);

				result.Add(responseDto);
			}

			await transaction.CommitAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error creating overlays");
			await transaction.RollbackAsync(cancellationToken);
			await this.UndoFileCreation(request);
			throw;
		}

		return result.ToArray();
	}

	private async Task UndoFileCreation(CreateOverlaysCommand request)
	{
		var surfaceProjectId = this.context.Surfaces.Where(s => s.Id == request.SurfaceId).Select(s => s.ProjectId).FirstOrDefault();

		foreach (var o in request.Overlays)
		{			
			await this.fileStorage.DeleteFileAsync(surfaceProjectId, o.FileName);
		}
	}
}
