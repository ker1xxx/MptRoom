using Microsoft.EntityFrameworkCore;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.Blazor;
using MptRoomAPI.Models.Base;

namespace MptRoomAPI.Models
{
    public class MptRoomDbContext : DbContext
    {
        public DbSet<UserBase> Users { get; set; }
        public DbSet<AdditionalMaterialModel> AdditionalMaterials { get; set; }
        public DbSet<AdministratorModel> Administrators { get; set; }
        public DbSet<AuthorizationDataModel> AuthorizationDatas { get; set; }
        public DbSet<CommentModel> Comments { get; set; }
        public DbSet<CourseModel> Courses { get; set; }
        public DbSet<GroupModel> Groups { get; set; }
        public DbSet<HousingModel> Housings { get; set; }
        public DbSet<LessonModel> Lessons { get; set; }
        public DbSet<LessonSlotModel> LessonSlots { get; set; }
        public DbSet<LessonSupersedeRequestModel> LessonSupressedRequests { get; set; }
        public DbSet<PersonalDataModel> PersonalDatas { get; set; }
        public DbSet<PostModel> Posts { get; set; }
        public DbSet<PostThemeModel> PostThemes { get; set; }
        public DbSet<RefreshTokenModel> RefreshTokens { get; set; }
        public DbSet<StudentModel> Students { get; set; }
        public DbSet<SubjectModel> Subjects { get; set; }
        public DbSet<SurveyAnswerModel> SurveyAnswers { get; set; }
        public DbSet<SurveyOptionModel> SurveyOptions { get; set; }
        public DbSet<TaskAnswerModel> TaskAnswers { get; set; }
        public DbSet<TaskModel> Tasks { get; set; }
        public DbSet<TeacherModel> Teachers { get; set; }

        public MptRoomDbContext(DbContextOptions<MptRoomDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            #region UserBase

            modelBuilder.Entity<UserBase>()
                .HasDiscriminator<string>("UserType")
                .HasValue<UserBase>("User")
                .HasValue<AdministratorModel>("Administrator")
                .HasValue<TeacherModel>("Teacher")
                .HasValue<StudentModel>("Student");

            modelBuilder.Entity<UserBase>()
                .HasKey(u => u.UserId);

            modelBuilder.Entity<UserBase>()
                .HasOne(u => u.PersonalData)
                .WithMany()
                .HasForeignKey(u => u.PersonalDataId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<UserBase>()
                .HasOne(u => u.AuthorizationData)
                .WithMany()
                .HasForeignKey(u => u.AuthorizationDataId)
                .OnDelete(DeleteBehavior.Cascade);

            #endregion

            #region AdditionalMaterial

            modelBuilder.Entity<AdditionalMaterialModel>()
                .HasKey(a => a.AdditionalMaterialId);

            modelBuilder.Entity<AdditionalMaterialModel>()
                .HasOne(a => a.User)
                .WithMany(u => u.Materials)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AdditionalMaterialModel>()
                .HasOne(a => a.Post)
                .WithMany(p => p.Materials)
                .HasForeignKey(a => a.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AdditionalMaterialModel>()
                .Property(a => a.UriAbsolutePath)
                .HasMaxLength(500)
                .IsRequired();
            #endregion

            #region AdministratorModel


            #endregion

            #region AuthorizationModel

            modelBuilder.Entity<AuthorizationDataModel>()
                .HasKey(a => a.AuthorizationDataId);

            #endregion

            #region CommentModel

            modelBuilder.Entity<CommentModel>()
                .HasKey(c => c.CommentId);

            modelBuilder.Entity<CommentModel>()
                .HasOne(c => c.Post)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CommentModel>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.AuthorId)
                .OnDelete(DeleteBehavior.Cascade);

            #endregion

            #region CourseModel

            modelBuilder.Entity<CourseModel>()
                .HasKey(c => c.CourseId);

            modelBuilder.Entity<CourseModel>()
                .HasOne(c => c.Subject)
                .WithMany()
                .HasForeignKey(c => c.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CourseModel>()
                .HasOne(c => c.Group)
                .WithMany()
                .HasForeignKey(c => c.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CourseModel>()
                .HasOne(c => c.Teacher)
                .WithMany()
                .HasForeignKey(c => c.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CourseModel>()
                .HasMany(c => c.Students)
                .WithMany(s => s.Courses);

            #endregion

            #region GroupModel

            modelBuilder.Entity<GroupModel>()
                .HasKey(g => g.GroupId);

            #endregion

            #region HousingModel 

            modelBuilder.Entity<HousingModel>()
                .HasKey(h => h.HousingId);

            #endregion

            #region LessonModel

            modelBuilder.Entity<LessonModel>()
                .HasKey(l => l.LessonId);

            modelBuilder.Entity<LessonModel>()
                .HasOne(l => l.Subject)
                .WithMany(s => s.Lessons)
                .HasForeignKey(l => l.SubjectId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LessonModel>()
                .HasOne(l => l.Group)
                .WithMany(g => g.Lessons)
                .HasForeignKey(l => l.GroupId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LessonModel>()
                .HasOne(l => l.LessonNumber)
                .WithMany()
                .HasForeignKey(l => l.LessonNumberId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LessonModel>()
                .HasOne(l => l.Housing)
                .WithMany(h => h.Lessons)
                .HasForeignKey(l => l.HousingId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<LessonModel>()
                .HasOne(l => l.Teacher)
                .WithMany(t => t.Lessons)
                .HasForeignKey(l => l.TeacherId)
                .OnDelete(DeleteBehavior.Restrict);

            #endregion

            #region LessonSlotModel

            modelBuilder.Entity<LessonSlotModel>()
                .HasKey(l => l.LessonSlotId);

            #endregion

            #region LessonSupersedeRequestModel

            modelBuilder.Entity<LessonSupersedeRequestModel>()
               .HasKey(lsr => lsr.SupersedeRequestId);

            modelBuilder.Entity<LessonSupersedeRequestModel>()
                .HasOne(lsr => lsr.Teacher)
                .WithMany(t => t.SupersedeRequests)
                .HasForeignKey(lsr => lsr.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LessonSupersedeRequestModel>()
                .HasOne(lsr => lsr.Group)
                .WithMany(g => g.LessonSupersedeRequests)
                .HasForeignKey(lsr => lsr.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LessonSupersedeRequestModel>()
                .HasOne(lsr => lsr.LessonSlot)
                .WithMany()
                .HasForeignKey(lsr => lsr.LessonSlotId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LessonSupersedeRequestModel>()
                .HasOne(lsr => lsr.Subject)
                .WithMany()
                .HasForeignKey(lsr => lsr.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LessonSupersedeRequestModel>()
                .HasOne(lsr => lsr.Lesson)
                .WithMany()
                .HasForeignKey(lsr => lsr.AffectedLessonId)
                .OnDelete(DeleteBehavior.Cascade);

            #endregion

            #region PersonalDataModel

            modelBuilder.Entity<PersonalDataModel>()
                .HasKey(p => p.PersonalDataId);

            #endregion

            #region PostModel

            modelBuilder.Entity<PostModel>()
                .HasKey(p => p.PostId);

            modelBuilder.Entity<PostModel>()
                .HasOne(p => p.PostTheme)
                .WithMany(pt => pt.Posts)
                .HasForeignKey(p => p.PostThemeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PostModel>()
                .HasOne(p => p.Course)
                .WithMany(c => c.Posts)
                .HasForeignKey(p => p.CourseId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PostModel>()
                .HasOne(p => p.Teacher)
                .WithMany(t => t.Posts)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PostModel>()
                .HasMany(p => p.Materials)
                .WithOne(am => am.Post)
                .HasForeignKey(p => p.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            #endregion

            #region PostThemeModel

            modelBuilder.Entity<PostThemeModel>()
                .HasKey(pt => pt.PostThemeId);

            modelBuilder.Entity<PostThemeModel>()
                .HasOne(pt => pt.Course)
                .WithMany(c => c.PostThemes)
                .HasForeignKey(pt => pt.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PostThemeModel>()
                .HasMany(pt => pt.Posts)
                .WithOne(p => p.PostTheme)
                .HasForeignKey(pt => pt.PostThemeId)
                .OnDelete(DeleteBehavior.SetNull);

            #endregion

            #region RefreshTokenModel

            modelBuilder.Entity<RefreshTokenModel>()
                .HasKey(rt => rt.RefreshTokenId);

            modelBuilder.Entity<RefreshTokenModel>()
                .HasOne(rt => rt.User)
                .WithOne(u => u.RefreshToken)
                .HasForeignKey<RefreshTokenModel>(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            #endregion

            #region StudentModel


            #endregion

            #region SubjectModel

            modelBuilder.Entity<SubjectModel>()
                .HasKey(s => s.SubjectId);

            modelBuilder.Entity<SubjectModel>()
                .Property(c => c.HexademicalColor)
                .HasMaxLength(500)
                .IsRequired();

            #endregion

            #region SurveyAnswerModel

            modelBuilder.Entity<SurveyAnswerModel>()
                .HasKey(sa => sa.SurveyAnswerId);

            modelBuilder.Entity<SurveyAnswerModel>()
                .HasOne(sa => sa.Student)
                .WithMany(s => s.SurveyAnswers)
                .HasForeignKey(sa => sa.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SurveyAnswerModel>()
                .HasOne(sa => sa.Post)
                .WithMany()
                .HasForeignKey(sa => sa.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SurveyAnswerModel>()
                .HasOne(sa => sa.SurveyOption)
                .WithMany()
                .HasForeignKey(sa => sa.SurveyOptionId)
                .OnDelete(DeleteBehavior.Cascade);


            #endregion

            #region SurveyOptionModel

            modelBuilder.Entity<SurveyOptionModel>()
                .HasKey(s => s.SurveyOptionId);

            modelBuilder.Entity<SurveyOptionModel>()
                .HasOne(so => so.Post)
                .WithMany()
                .HasForeignKey(so => so.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            #endregion

            #region TaskAnswerModel

            modelBuilder.Entity<TaskAnswerModel>()
                .HasKey(ta => ta.TaskAnswerId);

            modelBuilder.Entity<TaskAnswerModel>()
                .HasOne(ta => ta.AdditionalMaterial)
                .WithMany()
                .HasForeignKey(ta => ta.AdditionalMaterialId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskAnswerModel>()
                .HasOne(ta => ta.Student)
                .WithMany(s => s.TaskAnswers)
                .HasForeignKey(ta => ta.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskAnswerModel>()
                .HasOne(ta => ta.Task)
                .WithMany(t => t.TaskAnswers)
                .HasForeignKey(ta => ta.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            #endregion

            #region TaskModel

            modelBuilder.Entity<TaskModel>()
                .HasKey(t => t.TaskId);

            modelBuilder.Entity<TaskModel>()
                .HasOne(t => t.Post)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskModel>()
                .HasOne(t => t.Subject)
                .WithMany()
                .HasForeignKey(t => t.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskModel>()
                .HasOne(t => t.Teacher)
                .WithMany()
                .HasForeignKey(t => t.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskModel>()
                .HasOne(t => t.Course)
                .WithMany()
                .HasForeignKey(t => t.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskModel>()
                .HasOne(t => t.Student)
                .WithMany()
                .HasForeignKey(t => t.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskModel>()
                .HasMany(t => t.TaskAnswers)
                .WithOne(ta => ta.Task)
                .HasForeignKey(t => t.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            #endregion

            #region TeacherModel


            #endregion


            base.OnModelCreating(modelBuilder);
        }
    }
}
