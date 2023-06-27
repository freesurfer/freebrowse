using Azure.Storage.Blobs;
using FreeBrowse.Application.Common.Interfaces;

namespace FreeBrowse.Infrastructure.Services;

public class AzureBlobStorage : IFileStorage
{
	private readonly BlobContainerClient blobContainerClient;

	public AzureBlobStorage(BlobContainerClient containerClient)
	{
		this.blobContainerClient = containerClient;
	}

	public string CreateDirectory(int projectId)
	{
		return projectId.ToString();
	}

	public void DeleteDirectory(int projectId)
	{
		var prefix = projectId.ToString();

		foreach (var blob in this.blobContainerClient.GetBlobs(prefix: prefix))
		{
			this.blobContainerClient.DeleteBlobIfExists(blob.Name);
		}
	}

	public async Task<string> SaveFileAsync(string base64, int projectId, string fileName)
	{
		var bytes = Convert.FromBase64String(base64);

		return await this.SaveFileAsync(bytes, projectId, fileName);
	}

	public async Task<string> SaveFileAsync(byte[] fileData, int projectId, string fileName)
	{
		var blobName = Path.Combine(projectId.ToString(), fileName);
		var blobClient = this.blobContainerClient.GetBlobClient(blobName);

		using var memoryStream = new MemoryStream(fileData);
		await blobClient.UploadAsync(memoryStream, overwrite: true);

		return blobClient.Name;
	}

	public async Task DeleteFileAsync(int projectId, string fileName)
	{
		var blobName = Path.Combine(projectId.ToString(), fileName);

		await this.blobContainerClient.DeleteBlobIfExistsAsync(blobName);
	}

	public async Task<byte[]> GetFileBytesAsync(string filePath)
	{
		var blobClient = this.blobContainerClient.GetBlobClient(filePath);
		var response = await blobClient.DownloadAsync();

		using (var memoryStream = new MemoryStream())
		{
			await response.Value.Content.CopyToAsync(memoryStream);
			return memoryStream.ToArray();
		}
	}

	public async Task<long> GetFileSizeAsync(string filePath)
	{
		var blobClient = this.blobContainerClient.GetBlobClient(filePath);
		var properties = await blobClient.GetPropertiesAsync();
		return properties.Value.ContentLength;
	}
}
