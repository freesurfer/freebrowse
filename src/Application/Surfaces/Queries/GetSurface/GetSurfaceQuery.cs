
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FreeBrowse.Application.Surfaces.Queries.GetSurface;

public class GetSurfaceQuery : IRequest<FileContentResult>
{
	public int Id { get; set; }
}
