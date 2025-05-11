using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddedAffectedLessonToLessonSupersedeRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AffectedLessonId",
                table: "LessonSupressedRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LessonSupressedRequests_AffectedLessonId",
                table: "LessonSupressedRequests",
                column: "AffectedLessonId");

            migrationBuilder.AddForeignKey(
                name: "FK_LessonSupressedRequests_Lessons_AffectedLessonId",
                table: "LessonSupressedRequests",
                column: "AffectedLessonId",
                principalTable: "Lessons",
                principalColumn: "LessonId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LessonSupressedRequests_Lessons_AffectedLessonId",
                table: "LessonSupressedRequests");

            migrationBuilder.DropIndex(
                name: "IX_LessonSupressedRequests_AffectedLessonId",
                table: "LessonSupressedRequests");

            migrationBuilder.DropColumn(
                name: "AffectedLessonId",
                table: "LessonSupressedRequests");
        }
    }
}
