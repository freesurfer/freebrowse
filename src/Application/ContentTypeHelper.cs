using Microsoft.AspNetCore.StaticFiles;

namespace FreeBrowse.Application;

public static class ContentTypeHelper
{
	public static string GetContentType(string fileName)
	{
		var provider = new FileExtensionContentTypeProvider();
		string contentType;
		if (!provider.TryGetContentType(fileName, out contentType))
		{
			contentType = "application/octet-stream";
		}

		return contentType;
	}
}
