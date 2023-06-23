using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public record GetProjectAnnotationDto : IMapFrom<Annotation>
{
	public int Id { get; set; }

	public string Path { get; set; } = null!;

	public string? FileName { get; set; }

	public long FileSize { get; set; }

	public string? Color { get; set; }

	public string? ColorMap { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public bool Selected { get; set; }
}
