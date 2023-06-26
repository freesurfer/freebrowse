using Azure.Storage.Blobs;
using FreeBrowse.Application.Common.Interfaces;
using FreeBrowse.Infrastructure.Identity;
using FreeBrowse.Infrastructure.Persistence;
using FreeBrowse.Infrastructure.Persistence.Interceptors;
using FreeBrowse.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

using static OpenIddict.Abstractions.OpenIddictConstants;

namespace Microsoft.Extensions.DependencyInjection;

public static class ConfigureServices
{
	public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
	{
		services.AddCors(o => o.AddPolicy("CorsPolicy", builder =>
		{
			builder
				.AllowAnyMethod()
				.AllowAnyHeader()
				.WithOrigins("http://localhost:44444");
		}));

		services.AddScoped<AuditableEntitySaveChangesInterceptor>();

		if (configuration.GetValue<bool>("UseInMemoryDatabase"))
		{
			services.AddDbContext<ApplicationDbContext>(
				options => options.UseInMemoryDatabase("FreeBrowseDb"));
		}
		else
		{
			services.AddDbContext<ApplicationDbContext>(
				options => options
					.UseSqlServer(
						configuration.GetConnectionString("DefaultConnection"),
						builder => builder.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName))
					.UseOpenIddict());
		}

		services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

		services.AddScoped<ApplicationDbContextInitialiser>();

		if (configuration.GetValue<bool>("UseLocalStorage"))
		{
			services.AddScoped<IFileStorage, LocalFileStorage>();
		}
		else
		{
			services.AddTransient(s => new BlobContainerClient(
				configuration["AzureBlob:BlobContainerConnection"],
				configuration["AzureBlob:BlobContainerName"]));
			services.AddScoped<IFileStorage, AzureBlobStorage>();
		}

		services
			.AddDefaultIdentity<ApplicationUser>(o =>
			{
				o.Password.RequireNonAlphanumeric = false;
				o.Password.RequireUppercase = false;
				o.Password.RequireLowercase = false;
				o.Password.RequiredLength = 3;
			})
			.AddRoles<IdentityRole>()
			.AddEntityFrameworkStores<ApplicationDbContext>()
			.AddDefaultTokenProviders();

		services.AddOpenIddict()

			// Register the OpenIddict core components.
			.AddCore(options =>
			{
				// Configure OpenIddict to use the Entity Framework Core stores and models.
				// Note: call ReplaceDefaultEntities() to replace the default OpenIddict entities.
				options
					.UseEntityFrameworkCore()
					.UseDbContext<ApplicationDbContext>();
			})

			// Register the OpenIddict server components.
			.AddServer(options =>
			{
				// Enable the authorization, logout, token and userinfo endpoints.
				options
					.SetAuthorizationEndpointUris("connect/authorize")
					.SetLogoutEndpointUris("connect/logout")
					.SetTokenEndpointUris("connect/token")
					.SetUserinfoEndpointUris("connect/userinfo");

				// Mark the "email", "profile" and "roles" scopes as supported scopes.
				options.RegisterScopes(Scopes.Email, Scopes.Profile, Scopes.Roles);

				// Note: this sample only uses the authorization code flow but you can enable
				// the other flows if you need to support implicit, password or client credentials.
				options
					.AllowPasswordFlow()
					.AcceptAnonymousClients();

				// Register the signing and encryption credentials.
				options
					.AddDevelopmentEncryptionCertificate()
					.AddDevelopmentSigningCertificate();

				// Register the ASP.NET Core host and configure the ASP.NET Core-specific options.
				options
					.UseAspNetCore()
					.EnableAuthorizationEndpointPassthrough()
					.EnableLogoutEndpointPassthrough()
					.EnableTokenEndpointPassthrough()
					.EnableUserinfoEndpointPassthrough()
					.EnableStatusCodePagesIntegration();
			})

			// Register the OpenIddict validation components.
			.AddValidation(options =>
			{
				// Import the configuration from the local OpenIddict server instance.
				options.UseLocalServer();

				// Register the ASP.NET Core host.
				options.UseAspNetCore();
			});

		services.AddTransient<IDateTime, DateTimeService>();
		services.AddTransient<IIdentityService, IdentityService>();
		services.AddTransient<IBearerTokenFactory, BearerTokenFactory>();

		services.AddAuthentication();

		services.AddAuthorization(
			options => options.AddPolicy("CanPurge", policy => policy.RequireRole("Administrator")));

		return services;
	}
}
