using AutoMapper;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.PointSets.Commands.CreatePointSet;

public class CreatePointSetCommandHandler : IRequestHandler<CreatePointSetCommand, CreatePointSetResponseDto>
{
	private readonly IApplicationDbContext context;
	private readonly IFileStorage fileStorage;
	private readonly IMapper mapper;
	private readonly ILogger<CreatePointSetCommandHandler> logger;

	public CreatePointSetCommandHandler(IApplicationDbContext context, IFileStorage fileStorage, IMapper mapper, ILogger<CreatePointSetCommandHandler> logger)
	{
		this.context = context;
		this.fileStorage = fileStorage;
		this.mapper = mapper;
		this.logger = logger;
	}

	public async Task<CreatePointSetResponseDto> Handle(CreatePointSetCommand request, CancellationToken cancellationToken)
	{
		var result = new CreatePointSetResponseDto();

		try
		{
			var filePath = await this.fileStorage.SaveFileAsync(request.Base64, request.ProjectId, request.FileName);

			var pointSet = new PointSet
			{
				Path = filePath,
				FileName = request.FileName,
				Order = request.Order,
				Opacity = request.Opacity,
				Visible = request.Visible,
				ProjectId = request.ProjectId
			};

			this.context.PointSets.Add(pointSet);

			await this.context.SaveChangesAsync(cancellationToken);

			result = this.mapper.Map<CreatePointSetResponseDto>(pointSet);
			result.FileSize = await this.fileStorage.GetFileSizeAsync(filePath);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error creating point set");
			await this.fileStorage.DeleteFileAsync(request.ProjectId, request.FileName);
			throw;
		}

		return result;
	}
}
