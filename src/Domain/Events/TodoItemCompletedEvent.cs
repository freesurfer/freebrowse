namespace FreeBrowse.Domain.Events;

public class TodoItemCompletedEvent : BaseEvent
{
    public TodoItemCompletedEvent(TodoItem item)
    {
        this.Item = item;
    }

    public TodoItem Item { get; }
}
