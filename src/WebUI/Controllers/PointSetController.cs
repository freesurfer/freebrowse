using FreeBrowse.Application.PointSets.Commands.CreatePointSet;
using FreeBrowse.Application.PointSets.Commands.DeletePointSet;
using FreeBrowse.Application.PointSets.Commands.EditPointSet;
using FreeBrowse.Application.PointSets.Queries.GetPointSet;
using FreeBrowse.WebUI.Controllers;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using WebUI.Hubs;

namespace WebUI.Controllers;

public class PointSetController : ApiControllerBase
{
	private readonly IHubContext<PointSetsHub> hubContext;

	public PointSetController(IHubContext<PointSetsHub> hubContext) 
	{
		this.hubContext = hubContext;
	}

	[HttpGet]
	public async Task<FileContentResult> Get([FromQuery] GetPointSetQuery query)
	{
		return await this.Mediator.Send(query);
	}

	[HttpPost]
	public async Task<ActionResult<CreatePointSetResponseDto>> Create(CreatePointSetCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpPut]
	public async Task<ActionResult<EditPointResponseDto>> Edit(EditPointSetCommand command)
	{
		var result = await this.Mediator.Send(command);

		await this.hubContext.Clients.Group(result.ProjectId.ToString()).SendAsync("PointSetUpdate" , result.Id);

		return result;
	}

	[HttpDelete]
	public async Task<Unit> Delete(DeletePointSetCommand command)
	{
		return await this.Mediator.Send(command);
	}
}
