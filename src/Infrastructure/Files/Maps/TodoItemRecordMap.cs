using System.Globalization;
using FreeBrowse.Application.TodoLists.Queries.ExportTodos;
using CsvHelper.Configuration;

namespace FreeBrowse.Infrastructure.Files.Maps;

public class TodoItemRecordMap : ClassMap<TodoItemRecord>
{
    public TodoItemRecordMap()
    {
        this.AutoMap(CultureInfo.InvariantCulture);

        this.Map(m => m.Done).Convert(c => c.Value.Done ? "Yes" : "No");
    }
}
