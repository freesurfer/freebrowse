using AutoMapper;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Annotations.Commands.CreateAnnotations;

public class CreateAnnotationsCommandHandler : IRequestHandler<CreateAnnotationsCommand, CreateAnnotationResponseDto[]>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly IMapper mapper;
	private readonly ILogger<CreateAnnotationsCommandHandler> logger;

	public CreateAnnotationsCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, IMapper mapper, ILogger<CreateAnnotationsCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.mapper = mapper;
		this.logger = logger;
	}

	public async Task<CreateAnnotationResponseDto[]> Handle(CreateAnnotationsCommand request, CancellationToken cancellationToken)
	{
		var result = new List<CreateAnnotationResponseDto>();

		var surfaceProjectId = this.context.Surfaces.Where(s => s.Id == request.SurfaceId).Select(s => s.ProjectId).FirstOrDefault();

		using var transaction = await this.context.BeginTransactionAsync(cancellationToken);

		try
		{
			foreach (var o in request.Annotations)
			{
				var filePath = await this.fileStorage.SaveFileAsync(o.Base64, surfaceProjectId, o.FileName);

				var annotation = new Annotation
				{
					Path = filePath,
					FileName = o.FileName,
					Base64 = o.Base64,
					Color = o.Color,
					Opacity = o.Opacity,
					Visible = o.Visible,
					SurfaceId = request.SurfaceId
				};

				this.context.Annotations.Add(annotation);

				await this.context.SaveChangesAsync(cancellationToken);

				var responseDto = this.mapper.Map<CreateAnnotationResponseDto>(annotation);
				responseDto.FileSize = new FileInfo(filePath).Length;

				result.Add(responseDto);
			}

			await transaction.CommitAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error creating annotations");
			await transaction.RollbackAsync(cancellationToken);
			await this.UndoFileCreation(request);
			throw;
		}

		return result.ToArray();
	}

	private async Task UndoFileCreation(CreateAnnotationsCommand request)
	{
		var surfaceProjectId = this.context.Surfaces.Where(s => s.Id == request.SurfaceId).Select(s => s.ProjectId).FirstOrDefault();

		foreach (var o in request.Annotations)
		{
			await this.fileStorage.DeleteFileAsync(surfaceProjectId, o.FileName);
		}
	}
}
