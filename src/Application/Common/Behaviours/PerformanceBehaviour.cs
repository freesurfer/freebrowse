using System.Diagnostics;
using FreeBrowse.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.Common.Behaviours;

public class PerformanceBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    private readonly Stopwatch timer;
    private readonly ILogger<TRequest> logger;
    private readonly ICurrentUserService currentUserService;
    private readonly IIdentityService identityService;

    public PerformanceBehaviour(
        ILogger<TRequest> logger,
        ICurrentUserService currentUserService,
        IIdentityService identityService)
    {
        this.timer = new Stopwatch();

        this.logger = logger;
        this.currentUserService = currentUserService;
        this.identityService = identityService;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        this.timer.Start();

        var response = await next();

        this.timer.Stop();

        var elapsedMilliseconds = this.timer.ElapsedMilliseconds;

        if (elapsedMilliseconds > 500)
        {
            var requestName = typeof(TRequest).Name;
            var userId = this.currentUserService.UserId ?? string.Empty;
            var userName = string.Empty;

            if (!string.IsNullOrEmpty(userId))
            {
                userName = await this.identityService.GetUserNameAsync(userId);
            }

            this.logger.LogWarning(
                "FreeBrowse Long Running Request: {Name} ({ElapsedMilliseconds} milliseconds) {@UserId} {@UserName} {@Request}",
                requestName,
                elapsedMilliseconds,
                userId,
                userName,
                request);
        }

        return response;
    }
}
