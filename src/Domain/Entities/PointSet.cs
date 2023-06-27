namespace FreeBrowse.Domain.Entities;

public class PointSet : BaseAuditableEntity
{
	public string Path { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public int ProjectId { get; set; }

	public Project Project { get; set; } = null!;
}
