using FreeBrowse.Application.Common.Interfaces;

namespace FreeBrowse.Infrastructure.Services;
public class LocalFileStorage : IFileStorage
{
	private readonly string basePath;

	public LocalFileStorage()
	{
		this.basePath = Path.Combine(Directory.GetCurrentDirectory(), "Files");
	}

	public string CreateDirectory(int solutionId)
	{
		var folderPath = Path.Combine(this.basePath, solutionId.ToString());
		Directory.CreateDirectory(folderPath);

		return folderPath;
	}

	public void DeleteDirectory(int solutionId)
	{
		var folderPath = Path.Combine(this.basePath, solutionId.ToString());
		Directory.Delete(folderPath, true);
	}

	public async Task<string> SaveFileAsync(string base64, int solutionId, string fileName)
	{
		var filePath = Path.Combine(this.basePath, solutionId.ToString(), fileName);
		var bytes = Convert.FromBase64String(base64);
		await File.WriteAllBytesAsync(filePath, bytes);

		return filePath;
	}

	public async Task<string> SaveFileAsync(byte[] fileData, int solutionId, string fileName)
	{
		var filePath = Path.Combine(this.basePath, solutionId.ToString(), fileName);
		await File.WriteAllBytesAsync(filePath, fileData);

		return filePath;
	}

	public Task DeleteFileAsync(int solutionId, string fileName)
	{
		var filePath = Path.Combine(this.basePath, solutionId.ToString(), fileName);
		File.Delete(filePath);

		return Task.CompletedTask;
	}
}
