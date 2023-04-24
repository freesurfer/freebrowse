using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FreeBrowse.Infrastructure.Persistence.Migrations;

/// <inheritdoc />
public partial class ReplaceIdentityServer : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "DeviceCodes");

        migrationBuilder.DropTable(
            name: "Keys");

        migrationBuilder.DropTable(
            name: "PersistedGrants");

        migrationBuilder.CreateTable(
            name: "OpenIddictApplications",
            columns: table => new
            {
                Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                ClientId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                ClientSecret = table.Column<string>(type: "nvarchar(max)", nullable: true),
                ConcurrencyToken = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                ConsentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                DisplayNames = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Permissions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                PostLogoutRedirectUris = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Properties = table.Column<string>(type: "nvarchar(max)", nullable: true),
                RedirectUris = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Requirements = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OpenIddictApplications", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "OpenIddictScopes",
            columns: table => new
            {
                Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                ConcurrencyToken = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Descriptions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                DisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                DisplayNames = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                Properties = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Resources = table.Column<string>(type: "nvarchar(max)", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OpenIddictScopes", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "OpenIddictAuthorizations",
            columns: table => new
            {
                Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                ApplicationId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                ConcurrencyToken = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                Properties = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Scopes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                Subject = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OpenIddictAuthorizations", x => x.Id);
                table.ForeignKey(
                    name: "FK_OpenIddictAuthorizations_OpenIddictApplications_ApplicationId",
                    column: x => x.ApplicationId,
                    principalTable: "OpenIddictApplications",
                    principalColumn: "Id");
            });

        migrationBuilder.CreateTable(
            name: "OpenIddictTokens",
            columns: table => new
            {
                Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                ApplicationId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                AuthorizationId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                ConcurrencyToken = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                CreationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                ExpirationDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                Payload = table.Column<string>(type: "nvarchar(max)", nullable: true),
                Properties = table.Column<string>(type: "nvarchar(max)", nullable: true),
                RedemptionDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                ReferenceId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                Subject = table.Column<string>(type: "nvarchar(400)", maxLength: 400, nullable: true),
                Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OpenIddictTokens", x => x.Id);
                table.ForeignKey(
                    name: "FK_OpenIddictTokens_OpenIddictApplications_ApplicationId",
                    column: x => x.ApplicationId,
                    principalTable: "OpenIddictApplications",
                    principalColumn: "Id");
                table.ForeignKey(
                    name: "FK_OpenIddictTokens_OpenIddictAuthorizations_AuthorizationId",
                    column: x => x.AuthorizationId,
                    principalTable: "OpenIddictAuthorizations",
                    principalColumn: "Id");
            });

        migrationBuilder.CreateIndex(
            name: "IX_OpenIddictApplications_ClientId",
            table: "OpenIddictApplications",
            column: "ClientId",
            unique: true,
            filter: "[ClientId] IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "IX_OpenIddictAuthorizations_ApplicationId_Status_Subject_Type",
            table: "OpenIddictAuthorizations",
            columns: new[] { "ApplicationId", "Status", "Subject", "Type" });

        migrationBuilder.CreateIndex(
            name: "IX_OpenIddictScopes_Name",
            table: "OpenIddictScopes",
            column: "Name",
            unique: true,
            filter: "[Name] IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "IX_OpenIddictTokens_ApplicationId_Status_Subject_Type",
            table: "OpenIddictTokens",
            columns: new[] { "ApplicationId", "Status", "Subject", "Type" });

        migrationBuilder.CreateIndex(
            name: "IX_OpenIddictTokens_AuthorizationId",
            table: "OpenIddictTokens",
            column: "AuthorizationId");

        migrationBuilder.CreateIndex(
            name: "IX_OpenIddictTokens_ReferenceId",
            table: "OpenIddictTokens",
            column: "ReferenceId",
            unique: true,
            filter: "[ReferenceId] IS NOT NULL");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "OpenIddictScopes");

        migrationBuilder.DropTable(
            name: "OpenIddictTokens");

        migrationBuilder.DropTable(
            name: "OpenIddictAuthorizations");

        migrationBuilder.DropTable(
            name: "OpenIddictApplications");

        migrationBuilder.CreateTable(
            name: "DeviceCodes",
            columns: table => new
            {
                UserCode = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                ClientId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                Data = table.Column<string>(type: "nvarchar(max)", maxLength: 50000, nullable: false),
                Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                DeviceCode = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                Expiration = table.Column<DateTime>(type: "datetime2", nullable: false),
                SessionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                SubjectId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_DeviceCodes", x => x.UserCode);
            });

        migrationBuilder.CreateTable(
            name: "Keys",
            columns: table => new
            {
                Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                Algorithm = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Created = table.Column<DateTime>(type: "datetime2", nullable: false),
                Data = table.Column<string>(type: "nvarchar(max)", nullable: false),
                DataProtected = table.Column<bool>(type: "bit", nullable: false),
                IsX509Certificate = table.Column<bool>(type: "bit", nullable: false),
                Use = table.Column<string>(type: "nvarchar(450)", nullable: true),
                Version = table.Column<int>(type: "int", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Keys", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "PersistedGrants",
            columns: table => new
            {
                Key = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                ClientId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                ConsumedTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                CreationTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                Data = table.Column<string>(type: "nvarchar(max)", maxLength: 50000, nullable: false),
                Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                Expiration = table.Column<DateTime>(type: "datetime2", nullable: true),
                SessionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                SubjectId = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_PersistedGrants", x => x.Key);
            });

        migrationBuilder.CreateIndex(
            name: "IX_DeviceCodes_DeviceCode",
            table: "DeviceCodes",
            column: "DeviceCode",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_DeviceCodes_Expiration",
            table: "DeviceCodes",
            column: "Expiration");

        migrationBuilder.CreateIndex(
            name: "IX_Keys_Use",
            table: "Keys",
            column: "Use");

        migrationBuilder.CreateIndex(
            name: "IX_PersistedGrants_ConsumedTime",
            table: "PersistedGrants",
            column: "ConsumedTime");

        migrationBuilder.CreateIndex(
            name: "IX_PersistedGrants_Expiration",
            table: "PersistedGrants",
            column: "Expiration");

        migrationBuilder.CreateIndex(
            name: "IX_PersistedGrants_SubjectId_ClientId_Type",
            table: "PersistedGrants",
            columns: new[] { "SubjectId", "ClientId", "Type" });

        migrationBuilder.CreateIndex(
            name: "IX_PersistedGrants_SubjectId_SessionId_Type",
            table: "PersistedGrants",
            columns: new[] { "SubjectId", "SessionId", "Type" });
    }
}
