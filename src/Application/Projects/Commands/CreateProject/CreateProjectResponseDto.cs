using FreeBrowse.Application.Common.Mappings;
using FreeBrowse.Domain.Entities;

namespace FreeBrowse.Application.Projects.Commands.CreateProject;

public class CreateProjectResponseDto : IMapFrom<Project>
{	
	public int Id { get; set; }

	public string? Name { get; set; }

	public double MeshThicknessOn2D { get; set; }

	public ICollection<VolumeResponseDto> Volumes { get; set; } = null!;

	public ICollection<SurfaceResponseDto> Surfaces { get; set; } = null!;
}

public class VolumeResponseDto : IMapFrom<Volume>
{
	public int Id { get; set; }

	public string Path { get; set; } = null!;

	public string FileName { get; set; } = null!;

	public long FileSize { get; set; }

	public string? Base64 { get; set; }

	public int Order { get; set; }

	public string? ColorMap { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }

	public int ContrastMin { get; set; }

	public int ContrastMax { get; set; }
}

public class SurfaceResponseDto : IMapFrom<Surface>
{
	public int Id { get; set; }

	public string Path { get; set; } = null!;

	public string? FileName { get; set; }

	public long FileSize { get; set; }

	public string? Base64 { get; set; }

	public int Order { get; set; }

	public string? Color { get; set; }

	public int Opacity { get; set; }

	public bool Visible { get; set; }
}
