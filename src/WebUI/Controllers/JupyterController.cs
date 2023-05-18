using FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterSolution;
using FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterSolutionFromBytes;
using FreeBrowse.WebUI.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace WebUI.Controllers;

public class JupyterController : ApiControllerBase
{
	[HttpPost("[action]")]
	public async Task<ActionResult<CreateJupyterSolutionResponseDto>> Create(CreateJupyterSolutionCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpPost("[action]")]
	public async Task<ActionResult<CreateJupyterSolutionFromBytesResponseDto>> CreateFromBytes(CreateJupyterSolutionFromBytesCommand command)
	{
		return await this.Mediator.Send(command);
	}
}
