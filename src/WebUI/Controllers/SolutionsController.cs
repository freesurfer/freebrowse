using FreeBrowse.Application.Solutions.Commands.CreateSolution;
using FreeBrowse.Application.Solutions.Commands.EditSolution;
using FreeBrowse.Application.Solutions.Commands.DeleteSolution;
using FreeBrowse.Application.Solutions.Queries.GetSolution;
using FreeBrowse.WebUI.Controllers;
using Microsoft.AspNetCore.Mvc;
using MediatR;

namespace WebUI.Controllers;

public class SolutionsController : ApiControllerBase
{
	[HttpGet]
	public async Task<ActionResult<SolutionDto>> GetSolution([FromQuery] GetSolutionQuery query)
	{
		return await this.Mediator.Send(query);
	}

	[HttpPost]
	public async Task<ActionResult<CreateSolutionResponseDto>> Create(CreateSolutionCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpPut]
	public async Task<ActionResult<EditSolutionResponseDto>> Edit(EditSolutionCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpDelete]
	public async Task<Unit> Delete(DeleteSolutionCommand command)
	{
		return await this.Mediator.Send(command);
	}
}
