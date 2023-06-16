using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Annotations.Commands.CreateAnnotations;

public record CreateAnnotationResponseDto : IMapFrom<Annotation>
{
	public int Id { get; set; }

	public string FileName { get; set; } = null!;

	public long FileSize { get; set; }

	public string? Path { get; set; }

	public string? Color { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public string? Base64 { get; set; }
}
