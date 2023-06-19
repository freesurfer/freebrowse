using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FreeBrowse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBase64 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Base64",
                table: "Volumes");

            migrationBuilder.DropColumn(
                name: "Base64",
                table: "Surfaces");

            migrationBuilder.DropColumn(
                name: "Base64",
                table: "Overlays");

            migrationBuilder.DropColumn(
                name: "Base64",
                table: "Annotations");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Base64",
                table: "Volumes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Base64",
                table: "Surfaces",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Base64",
                table: "Overlays",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Base64",
                table: "Annotations",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
