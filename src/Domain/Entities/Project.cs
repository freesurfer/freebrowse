namespace FreeBrowse.Domain.Entities;

public class Project : BaseAuditableEntity
{
	public Project()
	{
		this.Volumes = new HashSet<Volume>();
		this.Surfaces = new HashSet<Surface>();
	}

	public string? Name { get; set; }

	public double MeshThicknessOn2D { get; set; }

	public ICollection<Volume> Volumes { get; set; }

	public ICollection<Surface> Surfaces { get; set; }
}
