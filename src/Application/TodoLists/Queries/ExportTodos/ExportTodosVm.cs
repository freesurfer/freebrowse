namespace FreeBrowse.Application.TodoLists.Queries.ExportTodos;

public class ExportTodosVm
{
    public ExportTodosVm(string fileName, string contentType, byte[] content)
    {
        this.FileName = fileName;
        this.ContentType = contentType;
        this.Content = content;
    }

    public string FileName { get; set; }

    public string ContentType { get; set; }

    public byte[] Content { get; set; }
}
