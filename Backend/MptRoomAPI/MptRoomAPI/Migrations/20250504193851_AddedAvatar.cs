using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddedAvatar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarAbsoluteUri",
                table: "PersonalDatas",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarAbsoluteUri",
                table: "PersonalDatas");
        }
    }
}
