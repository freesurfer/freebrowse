using FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProject;
using FreeBrowse.Application.JupiterNotebook.Commands.CreateJupyterProjectFromBytes;
using FreeBrowse.WebUI.Controllers;
using Microsoft.AspNetCore.Mvc;

namespace WebUI.Controllers;

public class JupyterController : ApiControllerBase
{
	[HttpPost("[action]")]
	public async Task<ActionResult<CreateJupyterProjectResponseDto>> Create(CreateJupyterProjectCommand command)
	{
		return await this.Mediator.Send(command);
	}

	[HttpPost("[action]")]
	public async Task<ActionResult<CreateJupyterProjectFromBytesResponseDto>> CreateFromBytes(CreateJupyterProjectFromBytesCommand command)
	{
		return await this.Mediator.Send(command);
	}
}
