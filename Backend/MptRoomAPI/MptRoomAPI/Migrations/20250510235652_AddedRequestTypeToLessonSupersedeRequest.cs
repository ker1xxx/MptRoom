using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddedRequestTypeToLessonSupersedeRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SupersedeRequestType",
                table: "LessonSupressedRequests",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupersedeRequestType",
                table: "LessonSupressedRequests");
        }
    }
}
