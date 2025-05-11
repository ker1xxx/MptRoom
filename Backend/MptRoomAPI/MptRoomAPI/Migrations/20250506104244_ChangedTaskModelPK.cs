using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class ChangedTaskModelPK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_Tasks_TaskId",
                table: "TaskAnswers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Tasks",
                table: "Tasks");

            migrationBuilder.AlterColumn<int>(
                name: "TaskId",
                table: "Tasks",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Tasks",
                table: "Tasks",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_PostId",
                table: "Tasks",
                column: "PostId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_Tasks_TaskId",
                table: "TaskAnswers",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "TaskId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskAnswers_Tasks_TaskId",
                table: "TaskAnswers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Tasks",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_PostId",
                table: "Tasks");

            migrationBuilder.AlterColumn<int>(
                name: "TaskId",
                table: "Tasks",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_Tasks",
                table: "Tasks",
                column: "PostId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskAnswers_Tasks_TaskId",
                table: "TaskAnswers",
                column: "TaskId",
                principalTable: "Tasks",
                principalColumn: "PostId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
