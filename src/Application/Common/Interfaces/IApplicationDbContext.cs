using FreeBrowse.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace FreeBrowse.Application.Common.Interfaces;

public interface IApplicationDbContext
{
	DbSet<Project> Projects { get; }

	DbSet<PointSet> PointSets { get; }

	DbSet<Volume> Volumes { get; }

	DbSet<Surface> Surfaces { get; }

	DbSet<Overlay> Overlays { get; }

	DbSet<Annotation> Annotations { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

	Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken);

	Task CommitTransactionAsync(IDbContextTransaction transaction, CancellationToken cancellationToken);

	Task RollbackTransactionAsync(IDbContextTransaction transaction, CancellationToken cancellationToken);
}
