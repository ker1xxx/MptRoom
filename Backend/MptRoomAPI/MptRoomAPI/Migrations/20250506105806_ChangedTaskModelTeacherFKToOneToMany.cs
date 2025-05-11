using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class ChangedTaskModelTeacherFKToOneToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tasks_TeacherId",
                table: "Tasks");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_TeacherId",
                table: "Tasks",
                column: "TeacherId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tasks_TeacherId",
                table: "Tasks");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_TeacherId",
                table: "Tasks",
                column: "TeacherId",
                unique: true);
        }
    }
}
