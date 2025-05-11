using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class RefactorPostAndTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AdditionalMaterials_Tasks_TaskModelPostId",
                table: "AdditionalMaterials");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_PostThemes_PostThemeId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_Posts_PostId",
                table: "TaskAnswers");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_Posts_PostModelPostId",
                table: "TaskAnswers");

            migrationBuilder.DropIndex(
                name: "IX_TaskAnswers_PostModelPostId",
                table: "TaskAnswers");

            migrationBuilder.DropColumn(
                name: "PostModelPostId",
                table: "TaskAnswers");

            migrationBuilder.RenameColumn(
                name: "PostId",
                table: "TaskAnswers",
                newName: "TaskId");

            migrationBuilder.RenameIndex(
                name: "IX_TaskAnswers_PostId",
                table: "TaskAnswers",
                newName: "IX_TaskAnswers_TaskId");

            migrationBuilder.RenameColumn(
                name: "TaskModelPostId",
                table: "AdditionalMaterials",
                newName: "PostId");

            migrationBuilder.RenameIndex(
                name: "IX_AdditionalMaterials_TaskModelPostId",
                table: "AdditionalMaterials",
                newName: "IX_AdditionalMaterials_PostId");

            migrationBuilder.AddForeignKey(
                name: "FK_AdditionalMaterials_Posts_PostId",
                table: "AdditionalMaterials",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "PostId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_PostThemes_PostThemeId",
                table: "Posts",
                column: "PostThemeId",
                principalTable: "PostThemes",
                principalColumn: "PostThemeId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_Tasks_TaskId",
                table: "TaskAnswers",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "PostId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AdditionalMaterials_Posts_PostId",
                table: "AdditionalMaterials");

            migrationBuilder.DropForeignKey(
                name: "FK_Posts_PostThemes_PostThemeId",
                table: "Posts");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_Tasks_TaskId",
                table: "TaskAnswers");

            migrationBuilder.RenameColumn(
                name: "TaskId",
                table: "TaskAnswers",
                newName: "PostId");

            migrationBuilder.RenameIndex(
                name: "IX_TaskAnswers_TaskId",
                table: "TaskAnswers",
                newName: "IX_TaskAnswers_PostId");

            migrationBuilder.RenameColumn(
                name: "PostId",
                table: "AdditionalMaterials",
                newName: "TaskModelPostId");

            migrationBuilder.RenameIndex(
                name: "IX_AdditionalMaterials_PostId",
                table: "AdditionalMaterials",
                newName: "IX_AdditionalMaterials_TaskModelPostId");

            migrationBuilder.AddColumn<int>(
                name: "PostModelPostId",
                table: "TaskAnswers",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskAnswers_PostModelPostId",
                table: "TaskAnswers",
                column: "PostModelPostId");

            migrationBuilder.AddForeignKey(
                name: "FK_AdditionalMaterials_Tasks_TaskModelPostId",
                table: "AdditionalMaterials",
                column: "TaskModelPostId",
                principalTable: "Tasks",
                principalColumn: "PostId");

            migrationBuilder.AddForeignKey(
                name: "FK_Posts_PostThemes_PostThemeId",
                table: "Posts",
                column: "PostThemeId",
                principalTable: "PostThemes",
                principalColumn: "PostThemeId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_Posts_PostId",
                table: "TaskAnswers",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "PostId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_Posts_PostModelPostId",
                table: "TaskAnswers",
                column: "PostModelPostId",
                principalTable: "Posts",
                principalColumn: "PostId");
        }
    }
}
