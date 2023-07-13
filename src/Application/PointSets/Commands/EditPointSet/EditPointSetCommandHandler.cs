using AutoMapper;
using FreeBrowse.Application.Common.Exceptions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.PointSets.Commands.EditPointSet;

public class EditPointSetCommandHandler : IRequestHandler<EditPointSetCommand, EditPointResponseDto>
{
	private readonly IApplicationDbContext context;
	private readonly IMapper mapper;
	private readonly ILogger<EditPointSetCommandHandler> logger;

	public EditPointSetCommandHandler(IApplicationDbContext context, IMapper mapper, ILogger<EditPointSetCommandHandler> logger)
	{
		this.context = context;
		this.mapper = mapper;
		this.logger = logger;
	}

	public async Task<EditPointResponseDto> Handle(EditPointSetCommand request, CancellationToken cancellationToken)
	{
		var pointSet = await this.context.PointSets.FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken);

		if (pointSet == null)
		{
			throw new NotFoundException(nameof(PointSet), request.Id);
		}

		if (request.Base64 != null)
		{
			File.WriteAllBytes(pointSet.Path, Convert.FromBase64String(request.Base64));
		}

		pointSet.Order = request.Order ?? pointSet.Order;
		pointSet.Opacity = request.Opacity ?? pointSet.Opacity;
		pointSet.Visible = request.Visible ?? pointSet.Visible;

		try
		{
			await this.context.SaveChangesAsync(cancellationToken);
		}
		catch (Exception e)
		{
			this.logger.LogError(e, "Error updating point set");
			throw;
		}

		return this.mapper.Map<EditPointResponseDto>(pointSet);
	}
}
