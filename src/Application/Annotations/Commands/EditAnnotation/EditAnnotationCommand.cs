using MediatR;

namespace FreeBrowse.Application.Annotations.Commands.EditAnnotation;

public record EditAnnotationCommand : IRequest<int>
{
	public int Id { get; set; }

	public string? Base64 { get; set; }

	public string? Color { get; set; }

	public string? ColorMap { get; set; }

	public int? Opacity { get; set; }

	public bool? Visible { get; set; }

	public bool? Selected { get; set; }
}
