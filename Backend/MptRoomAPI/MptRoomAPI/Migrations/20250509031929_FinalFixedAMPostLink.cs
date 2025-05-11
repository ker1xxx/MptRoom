using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class FinalFixedAMPostLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AdditionalMaterials_Posts_PostId",
                table: "AdditionalMaterials");

            migrationBuilder.AddForeignKey(
                name: "FK_AdditionalMaterials_Posts_PostId",
                table: "AdditionalMaterials",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "PostId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AdditionalMaterials_Posts_PostId",
                table: "AdditionalMaterials");

            migrationBuilder.AddForeignKey(
                name: "FK_AdditionalMaterials_Posts_PostId",
                table: "AdditionalMaterials",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "PostId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
