using FreeBrowse.Application.Common.Models;
using FreeBrowse.Application.TodoItems.Commands.CreateTodoItem;
using FreeBrowse.Application.TodoItems.Commands.DeleteTodoItem;
using FreeBrowse.Application.TodoItems.Commands.UpdateTodoItem;
using FreeBrowse.Application.TodoItems.Commands.UpdateTodoItemDetail;
using FreeBrowse.Application.TodoItems.Queries.GetTodoItemsWithPagination;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FreeBrowse.WebUI.Controllers;

[Authorize]
public class TodoItemsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PaginatedList<TodoItemBriefDto>>> GetTodoItemsWithPagination([FromQuery] GetTodoItemsWithPaginationQuery query)
    {
        return await this.Mediator.Send(query);
    }

    [HttpPost]
    public async Task<ActionResult<int>> Create(CreateTodoItemCommand command)
    {
        return await this.Mediator.Send(command);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, UpdateTodoItemCommand command)
    {
        if (id != command.Id)
        {
            return this.BadRequest();
        }

        await this.Mediator.Send(command);

        return this.NoContent();
    }

    [HttpPut("[action]")]
    public async Task<ActionResult> UpdateItemDetails(int id, UpdateTodoItemDetailCommand command)
    {
        if (id != command.Id)
        {
            return this.BadRequest();
        }

        await this.Mediator.Send(command);

        return this.NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        await this.Mediator.Send(new DeleteTodoItemCommand(id));

        return this.NoContent();
    }
}
