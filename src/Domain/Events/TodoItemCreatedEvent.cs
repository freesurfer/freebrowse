namespace FreeBrowse.Domain.Events;

public class TodoItemCreatedEvent : BaseEvent
{
    public TodoItemCreatedEvent(TodoItem item)
    {
        this.Item = item;
    }

    public TodoItem Item { get; }
}
