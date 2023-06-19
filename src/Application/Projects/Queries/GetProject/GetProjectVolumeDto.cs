using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public record GetProjectVolumeDto : IMapFrom<Volume>
{
	public int Id { get; set; }

	public string Path { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public long FileSize { get; set; }

	public int Order { get; set; }

	public string? ColorMap { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public int ContrastMin { get; set; }

	public int ContrastMax { get; set; }
}
