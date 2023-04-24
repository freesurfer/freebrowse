using AutoMapper;
using AutoMapper.QueryableExtensions;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Application.Common.Security;
using FreeBrowse.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FreeBrowse.Application.TodoLists.Queries.GetTodos;

[Authorize]
public record GetTodosQuery : IRequest<TodosVm>;

public class GetTodosQueryHandler : IRequestHandler<GetTodosQuery, TodosVm>
{
    private readonly IApplicationDbContext context;
    private readonly IMapper mapper;

    public GetTodosQueryHandler(IApplicationDbContext context, IMapper mapper)
    {
        this.context = context;
        this.mapper = mapper;
    }

    public async Task<TodosVm> Handle(GetTodosQuery request, CancellationToken cancellationToken)
    {
        return new TodosVm
        {
            PriorityLevels = Enum.GetValues(typeof(PriorityLevel))
                .Cast<PriorityLevel>()
                .Select(p => new PriorityLevelDto { Value = (int)p, Name = p.ToString() })
                .ToList(),

            Lists = await this.context.TodoLists
                .AsNoTracking()
                .ProjectTo<TodoListDto>(this.mapper.ConfigurationProvider)
                .OrderBy(t => t.Title)
                .ToListAsync(cancellationToken)
        };
    }
}
