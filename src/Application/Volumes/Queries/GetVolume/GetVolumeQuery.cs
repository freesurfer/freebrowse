using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FreeBrowse.Application.Volumes.Queries.GetVolume;

public class GetVolumeQuery : IRequest<FileContentResult>
{
	public int Id { get; set; }
}
