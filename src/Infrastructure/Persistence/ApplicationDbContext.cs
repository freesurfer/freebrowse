using System.Reflection;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Domain.Entities;
using FreeBrowse.Infrastructure.Identity;
using FreeBrowse.Infrastructure.Persistence.Interceptors;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace FreeBrowse.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
{
    private readonly IMediator mediator;
    private readonly AuditableEntitySaveChangesInterceptor auditableEntitySaveChangesInterceptor;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        IMediator mediator,
        AuditableEntitySaveChangesInterceptor auditableEntitySaveChangesInterceptor) 
        : base(options)
    {
        this.mediator = mediator;
        this.auditableEntitySaveChangesInterceptor = auditableEntitySaveChangesInterceptor;
    }

    public DbSet<TodoList> TodoLists => this.Set<TodoList>();

    public DbSet<TodoItem> TodoItems => this.Set<TodoItem>();

    public DbSet<Solution> Solutions => this.Set<Solution>();

    public DbSet<Volume> Volumes => this.Set<Volume>();

    public DbSet<Surface> Surfaces => this.Set<Surface>();

	protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        base.OnModelCreating(builder);
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.AddInterceptors(this.auditableEntitySaveChangesInterceptor);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await this.mediator.DispatchDomainEvents(this);

        return await base.SaveChangesAsync(cancellationToken);
    }

	public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken)
	{
		return await this.Database.BeginTransactionAsync(cancellationToken);
	}

	public async Task CommitTransactionAsync(IDbContextTransaction transaction, CancellationToken cancellationToken)
	{
		await transaction.CommitAsync(cancellationToken);
	}

	public async Task RollbackTransactionAsync(IDbContextTransaction transaction, CancellationToken cancellationToken)
	{
		await transaction.RollbackAsync(cancellationToken);
	}
}
