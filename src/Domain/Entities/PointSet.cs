namespace FreeBrowse.Domain.Entities;

public class PointSet : BaseAuditableEntity
{
	public string Path { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public int Order { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public int ProjectId { get; set; }

	public Project Project { get; set; } = null!;
}
