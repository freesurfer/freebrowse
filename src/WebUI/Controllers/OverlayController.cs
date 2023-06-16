using FreeBrowse.Application.Overlays.Commands.CreateOverlays;
using FreeBrowse.Application.Overlays.Commands.DeleteOverlay;
using FreeBrowse.Application.Overlays.Commands.EditOverlay;
using FreeBrowse.Application.Overlays.Queries.GetOverlay;
using FreeBrowse.WebUI.Controllers;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace WebUI.Controllers;

public class OverlayController : ApiControllerBase
{
	[HttpGet]
	public async Task<FileContentResult> Get([FromQuery] GetOverlayQuery query)
	{
		return await this.Mediator.Send(query);
	}

	[HttpPost]
	public async Task<ActionResult<CreateOverlayResponseDto[]>> Create(CreateOverlaysCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpPut]
	public async Task<ActionResult<int>> Edit(EditOverlayCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpDelete]
	public async Task<Unit> Delete(DeleteOverlayCommand command)
	{
		return await this.Mediator.Send(command);
	}
}
