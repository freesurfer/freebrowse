using System.Globalization;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Application.TodoLists.Queries.ExportTodos;
using FreeBrowse.Infrastructure.Files.Maps;
using CsvHelper;

namespace FreeBrowse.Infrastructure.Files;

public class CsvFileBuilder : ICsvFileBuilder
{
    public byte[] BuildTodoItemsFile(IEnumerable<TodoItemRecord> records)
    {
        using var memoryStream = new MemoryStream();
        using (var streamWriter = new StreamWriter(memoryStream))
        {
            using var csvWriter = new CsvWriter(streamWriter, CultureInfo.InvariantCulture);

            csvWriter.Context.RegisterClassMap<TodoItemRecordMap>();
            csvWriter.WriteRecords(records);
        }

        return memoryStream.ToArray();
    }
}
