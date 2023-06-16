using FreeBrowse.Application.Annotations.Commands.CreateAnnotations;
using FreeBrowse.Application.Annotations.Commands.DeleteAnnotation;
using FreeBrowse.Application.Annotations.Commands.EditAnnotation;
using FreeBrowse.Application.Annotations.Queries.GetAnnotation;
using FreeBrowse.WebUI.Controllers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace WebUI.Controllers;

public class AnnotationController : ApiControllerBase
{
	[HttpGet]
	public async Task<FileContentResult> Get([FromQuery] GetAnnotationQuery query)
	{
		return await this.Mediator.Send(query);
	}

	[HttpPost]
	public async Task<ActionResult<CreateAnnotationResponseDto[]>> Create(CreateAnnotationsCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpPut]
	public async Task<ActionResult<int>> Edit(EditAnnotationCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpDelete]
	public async Task<Unit> Delete(DeleteAnnotationCommand command)
	{
		return await this.Mediator.Send(command);
	}
}
