using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FreeBrowse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameSurfaceNameToSurfaceFileName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Surfaces",
                newName: "FileName");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FileName",
                table: "Surfaces",
                newName: "Name");
        }
    }
}
