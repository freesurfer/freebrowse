using FreeBrowse.Application.Projects.Commands.CreateProject;
using FreeBrowse.Application.Projects.Commands.EditProject;
using FreeBrowse.Application.Projects.Commands.DeleteProject;
using FreeBrowse.Application.Projects.Queries.GetProject;
using FreeBrowse.WebUI.Controllers;
using Microsoft.AspNetCore.Mvc;
using MediatR;

namespace WebUI.Controllers;

public class ProjectsController : ApiControllerBase
{
	[HttpGet]
	public async Task<ActionResult<GetProjectDto>> GetProject([FromQuery] GetProjectQuery query)
	{
		return await this.Mediator.Send(query);
	}

	[HttpPost]
	public async Task<ActionResult<CreateProjectResponseDto>> Create(CreateProjectCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpPut]
	public async Task<ActionResult<EditProjectResponseDto>> Edit(EditProjectCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpDelete]
	public async Task<Unit> Delete(DeleteProjectCommand command)
	{
		return await this.Mediator.Send(command);
	}
}
