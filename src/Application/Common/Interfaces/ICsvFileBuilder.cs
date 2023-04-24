using FreeBrowse.Application.TodoLists.Queries.ExportTodos;

namespace FreeBrowse.Application.Common.Interfaces;

public interface ICsvFileBuilder
{
    byte[] BuildTodoItemsFile(IEnumerable<TodoItemRecord> records);
}
