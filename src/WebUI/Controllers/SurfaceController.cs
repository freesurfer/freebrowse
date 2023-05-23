using Microsoft.AspNetCore.Mvc;
using MediatR;
using FreeBrowse.Application.Surfaces.Commands.CreateSurfaces;
using FreeBrowse.Application.Surfaces.Commands.EditSurface;
using FreeBrowse.Application.Surfaces.Commands.DeleteSurface;
using FreeBrowse.Application.Surfaces.Queries.GetSurface;
using FreeBrowse.WebUI.Controllers;

namespace WebUI.Controllers;

public class SurfaceController : ApiControllerBase
{
	[HttpGet]
	public async Task<FileContentResult> Get([FromQuery] GetSurfaceQuery query)
	{
		return await this.Mediator.Send(query);
	}

	[HttpPost]
	public async Task<ActionResult<CreateSurfaceResponseDto[]>> Create(CreateSurfacesCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpPut]
	public async Task<ActionResult<int>> Edit(EditSurfaceCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpDelete]
	public async Task<Unit> Delete(DeleteSurfaceCommand command)
	{
		return await this.Mediator.Send(command);
	}
}
