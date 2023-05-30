using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Queries.GetProject;

public record VolumeDto : IMapFrom<Volume>
{
	public int Id { get; set; }

	public string Path { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public int Order { get; set; }

	public int Opacity { get; set; }

	public int ContrastMin { get; set; }

	public int ContrastMax { get; set; }
}
