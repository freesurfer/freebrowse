using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FreeBrowse.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertiesToPointSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Opacity",
                table: "PointSets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Order",
                table: "PointSets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "Visible",
                table: "PointSets",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Opacity",
                table: "PointSets");

            migrationBuilder.DropColumn(
                name: "Order",
                table: "PointSets");

            migrationBuilder.DropColumn(
                name: "Visible",
                table: "PointSets");
        }
    }
}
