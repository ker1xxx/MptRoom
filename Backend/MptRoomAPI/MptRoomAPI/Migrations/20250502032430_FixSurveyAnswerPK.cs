using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MptRoomAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixSurveyAnswerPK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_SurveyAnswers",
                table: "SurveyAnswers");

            migrationBuilder.AlterColumn<int>(
                name: "SurveyAnswerId",
                table: "SurveyAnswers",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true)
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_SurveyAnswers",
                table: "SurveyAnswers",
                column: "SurveyAnswerId");

            migrationBuilder.CreateIndex(
                name: "IX_SurveyAnswers_SurveyOptionId",
                table: "SurveyAnswers",
                column: "SurveyOptionId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_SurveyAnswers",
                table: "SurveyAnswers");

            migrationBuilder.DropIndex(
                name: "IX_SurveyAnswers_SurveyOptionId",
                table: "SurveyAnswers");

            migrationBuilder.AlterColumn<int>(
                name: "SurveyAnswerId",
                table: "SurveyAnswers",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_SurveyAnswers",
                table: "SurveyAnswers",
                column: "SurveyOptionId");
        }
    }
}
