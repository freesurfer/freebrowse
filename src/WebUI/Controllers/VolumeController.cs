using Microsoft.AspNetCore.Mvc;
using MediatR;
using FreeBrowse.Application.Volumes.Commands.CreateVolumes;
using FreeBrowse.Application.Volumes.Commands.EditVolume;
using FreeBrowse.Application.Volumes.Commands.DeleteVolume;
using FreeBrowse.Application.Volumes.Queries.GetVolume;
using FreeBrowse.WebUI.Controllers;

namespace WebUI.Controllers;

public class VolumeController : ApiControllerBase
{
	[HttpGet]
	public async Task<FileContentResult> Get([FromQuery] GetVolumeQuery query)
	{
		return await this.Mediator.Send(query);
	}

	[HttpPost]
	public async Task<ActionResult<CreateVolumeResponseDto[]>> Create(CreateVolumesCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpPut]
	public async Task<ActionResult<int>> Edit(EditVolumeCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpDelete]
	public async Task<Unit> Delete(DeleteVolumeCommand command)
	{
		return await this.Mediator.Send(command);
	}
}
