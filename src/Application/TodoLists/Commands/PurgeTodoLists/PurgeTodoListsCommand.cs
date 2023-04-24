using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Application.Common.Security;
using MediatR;

namespace FreeBrowse.Application.TodoLists.Commands.PurgeTodoLists;

[Authorize(Roles = "Administrator")]
[Authorize(Policy = "CanPurge")]
public record PurgeTodoListsCommand : IRequest;

public class PurgeTodoListsCommandHandler : IRequestHandler<PurgeTodoListsCommand>
{
    private readonly IApplicationDbContext context;

    public PurgeTodoListsCommandHandler(IApplicationDbContext context)
    {
        this.context = context;
    }

    public async Task<Unit> Handle(PurgeTodoListsCommand request, CancellationToken cancellationToken)
    {
        this.context.TodoLists.RemoveRange(this.context.TodoLists);

        await this.context.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
