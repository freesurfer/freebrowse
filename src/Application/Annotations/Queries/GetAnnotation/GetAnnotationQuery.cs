using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace FreeBrowse.Application.Annotations.Queries.GetAnnotation;

public class GetAnnotationQuery : IRequest<FileContentResult>
{
	public int Id { get; set; }
}
