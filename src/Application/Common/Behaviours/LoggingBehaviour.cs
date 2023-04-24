using FreeBrowse.Application.Common.Interfaces;
using MediatR.Pipeline;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Common.Behaviours;

public class LoggingBehaviour<TRequest> : IRequestPreProcessor<TRequest> where TRequest : notnull
{
    private readonly ILogger logger;
    private readonly ICurrentUserService currentUserService;
    private readonly IIdentityService identityService;

    public LoggingBehaviour(ILogger<TRequest> logger, ICurrentUserService currentUserService, IIdentityService identityService)
    {
        this.logger = logger;
        this.currentUserService = currentUserService;
        this.identityService = identityService;
    }

    public async Task Process(TRequest request, CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var userId = this.currentUserService.UserId ?? string.Empty;
        var userName = string.Empty;

        if (!string.IsNullOrEmpty(userId))
        {
            userName = await this.identityService.GetUserNameAsync(userId);
        }

        this.logger.LogInformation(
            "FreeBrowse Request: {Name} {@UserId} {@UserName} {@Request}",
            requestName,
            userId,
            userName,
            request);
    }
}
