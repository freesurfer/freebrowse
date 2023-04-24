using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using FreeBrowse.Application.Accounts.Queries.GetBearerToken;
using FreeBrowse.WebUI.Controllers;
using FreeBrowse.Application.Accounts.Commands.RegisterAccount;

namespace WebUI.Controllers;

public class AccountController : ApiControllerBase
{
	[HttpPost("~/connect/token")]
    public async Task<ActionResult<string>> Login()
    {
        var request = this.HttpContext.GetOpenIddictServerRequest();

        if (request == null || !request.IsPasswordGrantType())
        {
            return this.Unauthorized();
        }

        var query = new GetBearerTokenQuery { Username = request.Username, Password = request.Password };

        return await this.Mediator.Send(query);
    }

    [HttpPost("[action]")]
    public async Task<ActionResult<string>> Register(RegisterAccountCommand command)
    {
        return await this.Mediator.Send(command);
    }
}
