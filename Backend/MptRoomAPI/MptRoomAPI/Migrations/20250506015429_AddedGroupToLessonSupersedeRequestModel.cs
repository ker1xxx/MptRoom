using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddedGroupToLessonSupersedeRequestModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "LessonSupressedRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SupersedeRequestStatus",
                table: "LessonSupressedRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_LessonSupressedRequests_GroupId",
                table: "LessonSupressedRequests",
                column: "GroupId");

            migrationBuilder.AddForeignKey(
                name: "FK_LessonSupressedRequests_Groups_GroupId",
                table: "LessonSupressedRequests",
                column: "GroupId",
                principalTable: "Groups",
                principalColumn: "GroupId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LessonSupressedRequests_Groups_GroupId",
                table: "LessonSupressedRequests");

            migrationBuilder.DropIndex(
                name: "IX_LessonSupressedRequests_GroupId",
                table: "LessonSupressedRequests");

            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "LessonSupressedRequests");

            migrationBuilder.DropColumn(
                name: "SupersedeRequestStatus",
                table: "LessonSupressedRequests");
        }
    }
}
