namespace FreeBrowse.Application.Common.Interfaces;

public interface IBearerTokenFactory
{
    string GenerateToken(string username, string userId);
}
