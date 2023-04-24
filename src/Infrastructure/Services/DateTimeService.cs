using FreeBrowse.Application.Common.Interfaces;

namespace FreeBrowse.Infrastructure.Services;

public class DateTimeService : IDateTime
{
    public DateTime Now => DateTime.Now;

    public DateTime UtcNow => DateTime.UtcNow;
}
