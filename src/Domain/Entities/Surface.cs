namespace FreeBrowse.Domain.Entities;

public class Surface : BaseAuditableEntity
{
	public Surface()
	{ 
		this.Overlays = new HashSet<Overlay>();
		this.Annotations = new HashSet<Annotation>();
	}

	public string? Path { get; set; }

	public string? FileName { get; set; }

	public int Order { get; set; }

	public string? Color { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public ICollection<Overlay> Overlays { get; set; }

	public ICollection<Annotation> Annotations { get; set; }

	public int ProjectId { get; set; }

	public Project Project { get; set; } = null!;
}
