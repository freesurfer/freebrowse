using MediatR;

namespace FreeBrowse.Application.Annotations.Commands.CreateAnnotations;

public record CreateAnnotationsCommand : IRequest<CreateAnnotationResponseDto[]>
{
	public int SurfaceId { get; set; }

	public CreateAnnotationDto[] Annotations { get; set; } = null!;
}
