using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FreeBrowse.Application.Overlays.Queries.GetOverlay;

public class GetOverlayQuery : IRequest<FileContentResult>
{
	public int Id { get; set; }
}
