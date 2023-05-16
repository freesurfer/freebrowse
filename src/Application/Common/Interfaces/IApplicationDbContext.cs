using FreeBrowse.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace FreeBrowse.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<TodoList> TodoLists { get; }

    DbSet<TodoItem> TodoItems { get; }

	DbSet<Solution> Solutions { get; }

	DbSet<Volume> Volumes { get; }

	DbSet<Surface> Surfaces { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

	Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken);

	Task CommitTransactionAsync(IDbContextTransaction transaction, CancellationToken cancellationToken);

	Task RollbackTransactionAsync(IDbContextTransaction transaction, CancellationToken cancellationToken);
}
