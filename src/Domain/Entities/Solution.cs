namespace FreeBrowse.Domain.Entities;

public class Solution : BaseAuditableEntity
{
	public Solution()
	{
		this.Volumes = new HashSet<Volume>();
		this.Surfaces = new HashSet<Surface>();
	}

	public string? Name { get; set; }

	public ICollection<Volume> Volumes { get; set; }

	public ICollection<Surface> Surfaces { get; set; }
}
