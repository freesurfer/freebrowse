namespace FreeBrowse.Domain.Events;

public class TodoItemDeletedEvent : BaseEvent
{
    public TodoItemDeletedEvent(TodoItem item)
    {
        this.Item = item;
    }

    public TodoItem Item { get; }
}
