namespace FreeBrowse.Application.Projects.Commands.EditProject;

public record EditProjectResponseDto
{	
	public int Id { get; set; }
	public string Name { get; set; } = null!;
}