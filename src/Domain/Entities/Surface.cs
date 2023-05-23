namespace FreeBrowse.Domain.Entities;

public class Surface : BaseAuditableEntity
{
	public string? Path { get; set; }

	public string? FileName { get; set; }

	public int Order { get; set; }

	public int Opacity { get; set; }

	public int ProjectId { get; set; }

	public Project Project { get; set; } = null!;
}
