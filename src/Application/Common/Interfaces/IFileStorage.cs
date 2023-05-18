namespace FreeBrowse.Application.Common.Interfaces;

public interface IFileStorage
{
	string CreateDirectory(int solutionId);

	void DeleteDirectory(int solutionId);

	Task<string> SaveFileAsync(string base64, int solutionId, string fileName);

	Task<string> SaveFileAsync(byte[] fileData, int solutionId, string fileName);

	Task DeleteFileAsync(int solutionId, string fileName);
}
