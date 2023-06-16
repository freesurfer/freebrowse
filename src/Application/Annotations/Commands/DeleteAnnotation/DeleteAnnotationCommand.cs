using MediatR;

namespace FreeBrowse.Application.Annotations.Commands.DeleteAnnotation;

public record DeleteAnnotationCommand : IRequest
{
	public int Id { get; set; }
}
