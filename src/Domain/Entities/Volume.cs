namespace FreeBrowse.Domain.Entities;

public class Volume : BaseAuditableEntity
{
	public string? Path { get; set; }

	public string FileName { get; set; } = null!;

	public int Order { get; set; }

	public int Opacity { get; set; }

	public int ContrastMin { get; set; }

	public int ContrastMax { get; set; }

	public int ProjectId { get; set; }

	public Project Project { get; set; } = null!;
}
