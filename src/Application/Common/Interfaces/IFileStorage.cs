namespace FreeBrowse.Application.Common.Interfaces;

public interface IFileStorage
{
	string CreateDirectory(int projectId);

	void DeleteDirectory(int projectId);

	Task<string> SaveFileAsync(string base64, int projectId, string fileName);

	Task<string> SaveFileAsync(byte[] fileData, int projectId, string fileName);

	Task DeleteFileAsync(int projectId, string fileName);
}
