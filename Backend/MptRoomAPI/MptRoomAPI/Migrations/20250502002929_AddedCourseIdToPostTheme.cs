using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddedCourseIdToPostTheme : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CourseId",
                table: "PostThemes",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PostThemes_CourseId",
                table: "PostThemes",
                column: "CourseId");

            migrationBuilder.AddForeignKey(
                name: "FK_PostThemes_Courses_CourseId",
                table: "PostThemes",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "CourseId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PostThemes_Courses_CourseId",
                table: "PostThemes");

            migrationBuilder.DropIndex(
                name: "IX_PostThemes_CourseId",
                table: "PostThemes");

            migrationBuilder.DropColumn(
                name: "CourseId",
                table: "PostThemes");
        }
    }
}
