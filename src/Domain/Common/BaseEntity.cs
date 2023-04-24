using System.ComponentModel.DataAnnotations.Schema;

namespace FreeBrowse.Domain.Common;

public abstract class BaseEntity
{
    public int Id { get; set; }

    private readonly List<BaseEvent> domainEvents = new();

    [NotMapped]
    public IReadOnlyCollection<BaseEvent> DomainEvents => this.domainEvents.AsReadOnly();

    public void AddDomainEvent(BaseEvent domainEvent)
    {
        this.domainEvents.Add(domainEvent);
    }

    public void RemoveDomainEvent(BaseEvent domainEvent)
    {
        this.domainEvents.Remove(domainEvent);
    }

    public void ClearDomainEvents()
    {
        this.domainEvents.Clear();
    }
}
