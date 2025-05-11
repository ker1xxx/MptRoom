using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class ChangedTaskAnswerAdditionalMaterialTypeToNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_AdditionalMaterials_AdditionalMaterialId",
                table: "TaskAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_Posts_PostId",
                table: "TaskAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_Users_StudentId",
                table: "TaskAnswers");

            migrationBuilder.AlterColumn<int>(
                name: "AdditionalMaterialId",
                table: "TaskAnswers",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_AdditionalMaterials_AdditionalMaterialId",
                table: "TaskAnswers",
                column: "AdditionalMaterialId",
                principalTable: "AdditionalMaterials",
                principalColumn: "AdditionalMaterialId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_Posts_PostId",
                table: "TaskAnswers",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "PostId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_Users_StudentId",
                table: "TaskAnswers",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_AdditionalMaterials_AdditionalMaterialId",
                table: "TaskAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_Posts_PostId",
                table: "TaskAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_Users_StudentId",
                table: "TaskAnswers");

            migrationBuilder.AlterColumn<int>(
                name: "AdditionalMaterialId",
                table: "TaskAnswers",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_AdditionalMaterials_AdditionalMaterialId",
                table: "TaskAnswers",
                column: "AdditionalMaterialId",
                principalTable: "AdditionalMaterials",
                principalColumn: "AdditionalMaterialId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_Posts_PostId",
                table: "TaskAnswers",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "PostId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_Users_StudentId",
                table: "TaskAnswers",
                column: "StudentId",
                principalTable: "Users",
                principalColumn: "UserId");
        }
    }
}
