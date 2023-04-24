using FreeBrowse.Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FreeBrowse.Application.TodoItems.EventHandlers;

public class TodoItemCreatedEventHandler : INotificationHandler<TodoItemCreatedEvent>
{
    private readonly ILogger<TodoItemCreatedEventHandler> logger;

    public TodoItemCreatedEventHandler(ILogger<TodoItemCreatedEventHandler> logger)
    {
        this.logger = logger;
    }

    public Task Handle(TodoItemCreatedEvent notification, CancellationToken cancellationToken)
    {
        this.logger.LogInformation("FreeBrowse Domain Event: {DomainEvent}", notification.GetType().Name);

        return Task.CompletedTask;
    }
}
