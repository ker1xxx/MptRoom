using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class RemovedSaltFromAuthData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordSalt",
                table: "AuthorizationDatas");

            migrationBuilder.RenameColumn(
                name: "AddtionalMaterialId",
                table: "AdditionalMaterials",
                newName: "AdditionalMaterialId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "AdditionalMaterialId",
                table: "AdditionalMaterials",
                newName: "AddtionalMaterialId");

            migrationBuilder.AddColumn<string>(
                name: "PasswordSalt",
                table: "AuthorizationDatas",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
