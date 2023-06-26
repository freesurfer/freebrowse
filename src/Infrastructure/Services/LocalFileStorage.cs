using FreeBrowse.Application.Common.Interfaces;

namespace FreeBrowse.Infrastructure.Services;

public class LocalFileStorage : IFileStorage
{
	private readonly string basePath;

	public LocalFileStorage()
	{
		this.basePath = Path.Combine(Directory.GetCurrentDirectory(), "Files");
	}

	public string CreateDirectory(int projectId)
	{
		var folderPath = Path.Combine(this.basePath, projectId.ToString());
		Directory.CreateDirectory(folderPath);

		return folderPath;
	}

	public void DeleteDirectory(int projectId)
	{
		var folderPath = Path.Combine(this.basePath, projectId.ToString());
		Directory.Delete(folderPath, true);
	}

	public async Task<string> SaveFileAsync(string base64, int projectId, string fileName)
	{
		var filePath = Path.Combine(this.basePath, projectId.ToString(), fileName);
		var bytes = Convert.FromBase64String(base64);
		await File.WriteAllBytesAsync(filePath, bytes);

		return filePath;
	}

	public async Task<string> SaveFileAsync(byte[] fileData, int projectId, string fileName)
	{
		var filePath = Path.Combine(this.basePath, projectId.ToString(), fileName);
		await File.WriteAllBytesAsync(filePath, fileData);

		return filePath;
	}

	public Task DeleteFileAsync(int projectId, string fileName)
	{
		var filePath = Path.Combine(this.basePath, projectId.ToString(), fileName);
		File.Delete(filePath);

		return Task.CompletedTask;
	}

	public Task<byte[]> GetFileBytesAsync(string filePath)
	{
		return Task.FromResult(File.ReadAllBytes(filePath));
	}

	public Task<long> GetFileSizeAsync(string filePath)
	{
		if (!File.Exists(filePath))
		{
			throw new FileNotFoundException("File not found.", filePath);
		}

		return Task.FromResult(new FileInfo(filePath).Length);
	}
}
