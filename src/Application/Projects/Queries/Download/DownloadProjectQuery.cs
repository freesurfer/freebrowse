using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FreeBrowse.Application.Projects.Queries.Download;

public record DownloadProjectQuery : IRequest<FileContentResult>
{
	public int Id { get; set; }
}
