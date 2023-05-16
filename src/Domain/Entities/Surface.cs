namespace FreeBrowse.Domain.Entities;

public class Surface : BaseAuditableEntity
{
	public string? Path { get; set; }

	public string? Name { get; set; }

	public int Order { get; set; }

	public int Opacity { get; set; }

	public int SolutionId { get; set; }

	public Solution Solution { get; set; } = null!;
}
