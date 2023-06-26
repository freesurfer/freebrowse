using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FreeBrowse.Application.PointSets.Queries.GetPointSet;

public class GetPointSetQuery : IRequest<FileContentResult>
{
	public int Id { get; set; }
}
