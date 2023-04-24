using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using FreeBrowse.Application.Common.Interfaces;

namespace FreeBrowse.Infrastructure.Identity;

internal class BearerTokenFactory : IBearerTokenFactory
{
	private readonly IDateTime dateTime;
	private readonly IConfiguration configuration;

	public BearerTokenFactory(IDateTime dateTime, IConfiguration configuration)
	{
		this.dateTime = dateTime;
		this.configuration = configuration;
	}

	public string GenerateToken(string username, string userId)
    {
        var issuer = this.configuration["Jwt:Issuer"];
        var audience = this.configuration["Jwt:Audience"];
        var key = Encoding.ASCII.GetBytes(this.configuration["Jwt:Key"]!);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Email, username)
            }),
            Expires = this.dateTime.Now.AddDays(7),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha512Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        tokenHandler.WriteToken(token);

        return tokenHandler.WriteToken(token);
    }
}
