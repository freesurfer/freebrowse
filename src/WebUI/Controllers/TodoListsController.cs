using FreeBrowse.Application.TodoLists.Commands.CreateTodoList;
using FreeBrowse.Application.TodoLists.Commands.DeleteTodoList;
using FreeBrowse.Application.TodoLists.Commands.UpdateTodoList;
using FreeBrowse.Application.TodoLists.Queries.ExportTodos;
using FreeBrowse.Application.TodoLists.Queries.GetTodos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FreeBrowse.WebUI.Controllers;

public class TodoListsController : ApiControllerBase
{
    [HttpGet]
    public async Task<ActionResult<TodosVm>> Get()
    {
        return await this.Mediator.Send(new GetTodosQuery());
    }

    [HttpGet("{id}")]
    public async Task<FileResult> Get(int id)
    {
        var vm = await this.Mediator.Send(new ExportTodosQuery { ListId = id });

        return this.File(vm.Content, vm.ContentType, vm.FileName);
    }

    [HttpPost]
    public async Task<ActionResult<int>> Create(CreateTodoListCommand command)
    {
        return await this.Mediator.Send(command);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, UpdateTodoListCommand command)
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
        await this.Mediator.Send(new DeleteTodoListCommand(id));

        return this.NoContent();
    }
}
