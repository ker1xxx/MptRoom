using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddedGroupNameAndCourseHexColor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AddtionalMaterials_Tasks_TaskModelPostId",
                table: "AddtionalMaterials");

            migrationBuilder.DropForeignKey(
                name: "FK_AddtionalMaterials_Users_UserId",
                table: "AddtionalMaterials");

            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_LessonSlotModel_LessonNumberId",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_AddtionalMaterials_AdditionalMaterialId",
                table: "TaskAnswers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LessonSlotModel",
                table: "LessonSlotModel");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AddtionalMaterials",
                table: "AddtionalMaterials");

            migrationBuilder.RenameTable(
                name: "LessonSlotModel",
                newName: "LessonSlots");

            migrationBuilder.RenameTable(
                name: "AddtionalMaterials",
                newName: "AdditionalMaterials");

            migrationBuilder.RenameIndex(
                name: "IX_AddtionalMaterials_UserId",
                table: "AdditionalMaterials",
                newName: "IX_AdditionalMaterials_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_AddtionalMaterials_TaskModelPostId",
                table: "AdditionalMaterials",
                newName: "IX_AdditionalMaterials_TaskModelPostId");

            migrationBuilder.AddColumn<string>(
                name: "GroupName",
                table: "Groups",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HexademicalColor",
                table: "Courses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LessonSlots",
                table: "LessonSlots",
                column: "LessonSlotId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AdditionalMaterials",
                table: "AdditionalMaterials",
                column: "AddtionalMaterialId");

            migrationBuilder.AddForeignKey(
                name: "FK_AdditionalMaterials_Tasks_TaskModelPostId",
                table: "AdditionalMaterials",
                column: "TaskModelPostId",
                principalTable: "Tasks",
                principalColumn: "PostId");

            migrationBuilder.AddForeignKey(
                name: "FK_AdditionalMaterials_Users_UserId",
                table: "AdditionalMaterials",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_LessonSlots_LessonNumberId",
                table: "Lessons",
                column: "LessonNumberId",
                principalTable: "LessonSlots",
                principalColumn: "LessonSlotId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_AdditionalMaterials_AdditionalMaterialId",
                table: "TaskAnswers",
                column: "AdditionalMaterialId",
                principalTable: "AdditionalMaterials",
                principalColumn: "AddtionalMaterialId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AdditionalMaterials_Tasks_TaskModelPostId",
                table: "AdditionalMaterials");

            migrationBuilder.DropForeignKey(
                name: "FK_AdditionalMaterials_Users_UserId",
                table: "AdditionalMaterials");

            migrationBuilder.DropForeignKey(
                name: "FK_Lessons_LessonSlots_LessonNumberId",
                table: "Lessons");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_AdditionalMaterials_AdditionalMaterialId",
                table: "TaskAnswers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LessonSlots",
                table: "LessonSlots");

            migrationBuilder.DropPrimaryKey(
                name: "PK_AdditionalMaterials",
                table: "AdditionalMaterials");

            migrationBuilder.DropColumn(
                name: "GroupName",
                table: "Groups");

            migrationBuilder.DropColumn(
                name: "HexademicalColor",
                table: "Courses");

            migrationBuilder.RenameTable(
                name: "LessonSlots",
                newName: "LessonSlotModel");

            migrationBuilder.RenameTable(
                name: "AdditionalMaterials",
                newName: "AddtionalMaterials");

            migrationBuilder.RenameIndex(
                name: "IX_AdditionalMaterials_UserId",
                table: "AddtionalMaterials",
                newName: "IX_AddtionalMaterials_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_AdditionalMaterials_TaskModelPostId",
                table: "AddtionalMaterials",
                newName: "IX_AddtionalMaterials_TaskModelPostId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LessonSlotModel",
                table: "LessonSlotModel",
                column: "LessonSlotId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_AddtionalMaterials",
                table: "AddtionalMaterials",
                column: "AddtionalMaterialId");

            migrationBuilder.AddForeignKey(
                name: "FK_AddtionalMaterials_Tasks_TaskModelPostId",
                table: "AddtionalMaterials",
                column: "TaskModelPostId",
                principalTable: "Tasks",
                principalColumn: "PostId");

            migrationBuilder.AddForeignKey(
                name: "FK_AddtionalMaterials_Users_UserId",
                table: "AddtionalMaterials",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Lessons_LessonSlotModel_LessonNumberId",
                table: "Lessons",
                column: "LessonNumberId",
                principalTable: "LessonSlotModel",
                principalColumn: "LessonSlotId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_AddtionalMaterials_AdditionalMaterialId",
                table: "TaskAnswers",
                column: "AdditionalMaterialId",
                principalTable: "AddtionalMaterials",
                principalColumn: "AddtionalMaterialId");
        }
    }
}
