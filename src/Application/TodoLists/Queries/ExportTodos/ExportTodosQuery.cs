using AutoMapper;
using AutoMapper.QueryableExtensions;
using FreeBrowse.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.TodoLists.Queries.ExportTodos;

public record ExportTodosQuery : IRequest<ExportTodosVm>
{
    public int ListId { get; init; }
}

public class ExportTodosQueryHandler : IRequestHandler<ExportTodosQuery, ExportTodosVm>
{
    private readonly IApplicationDbContext context;
    private readonly IMapper mapper;
    private readonly ICsvFileBuilder fileBuilder;

    public ExportTodosQueryHandler(IApplicationDbContext context, IMapper mapper, ICsvFileBuilder fileBuilder)
    {
        this.context = context;
        this.mapper = mapper;
        this.fileBuilder = fileBuilder;
    }

    public async Task<ExportTodosVm> Handle(ExportTodosQuery request, CancellationToken cancellationToken)
    {
        var records = await this.context.TodoItems
            .Where(t => t.ListId == request.ListId)
            .ProjectTo<TodoItemRecord>(this.mapper.ConfigurationProvider)
            .ToListAsync(cancellationToken);

        var vm = new ExportTodosVm(
            "TodoItems.csv",
            "text/csv",
            this.fileBuilder.BuildTodoItemsFile(records));

        return vm;
    }
}
