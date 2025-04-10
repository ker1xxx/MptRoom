import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CourseViewModel } from '../../../../models/VM/course.viewmode';
import { CourseDTO } from '../../../../models/DTO/course.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TaskViewModel } from '../../../../models/VM/task.viewmodel';
import {
  Observable,
  forkJoin,
  of,
  map,
  switchMap,
  catchError,
  tap,
} from 'rxjs';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { CollegeYearEnum } from '../../../../models/enums/college-year.enum';
import { ApiService } from '../../../../services/api.service';
import { TaskStatusEnum } from '../../../../models/enums/task-status.enum';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { PostViewModel } from '../../../../models/VM/post.viewmodel';
import { PostDTO } from '../../../../models/DTO/post.dto';
import { PostThemeDTO } from '../../../../models/DTO/post-theme.dto';
import { UserBaseDTO } from '../../../../models/DTO/user-base.dto';
import { PostTypeEnum } from '../../../../models/enums/post-type.enum';

@Component({
  selector: 'app-course',
  standalone: true,
  imports: [HeaderComponent, CommonModule],
  templateUrl: './course.component.html',
  styleUrl: './course.component.scss',
})
export class CourseComponent {
  constructor(private api: ApiService, private route: ActivatedRoute) {}

  courseId!: number;
  course$?: CourseViewModel;
  student$?: StudentDTO;

  darknes_scale = [20, 40, 60];
  darkerColors: string[] = [];

  posts$?: PostViewModel[];

  ngOnInit(): void {
    this.api.student$
      .pipe(
        switchMap((student) => {
          if (!student) return of(null);
          this.student$ = student;

          return this.route.paramMap.pipe(
            switchMap((params) => {
              this.courseId = Number(params.get('courseId'));
              return this.getCourseWithTasks(student.userId!);
            })
          );
        })
      )
      .subscribe((course) => {
        if (course) {
          this.course$ = course;
          this.darkerColors = this.darknes_scale.map((scale) =>
            this.darkenColor(course.hexademicalColor, scale)
          );
        }
      });
  }

  getCourseWithTasks(studentId: number): Observable<CourseViewModel | null> {
    if (!this.courseId || this.courseId <= 0) {
      console.error('Invalid course ID:', this.courseId);
      return of(null);
    }

    return forkJoin({
      course: this.api.get<CourseDTO>(`Course/${this.courseId}`).pipe(
        catchError((error) => {
          console.error('Course fetch error:', error);
          return of(null);
        })
      ),
      tasks: this.api.get<TaskDTO[]>(`task/student/${studentId}`).pipe(
        catchError((error) => {
          console.error('Tasks fetch error:', error);
          return of([]);
        })
      ),
    }).pipe(
      switchMap(({ course, tasks }) => {
        if (!course) return of(null);

        const teacherRequest = this.api
          .get<TeacherDTO>(`teacher/${course.teacherId}`)
          .pipe(
            switchMap((teacher) =>
              this.api
                .get<PersonalDataDTO>(`personaldata/${teacher.personalDataId}`)
                .pipe(
                  map((personalData) => ({
                    teacherId: course.teacherId,
                    personalData,
                  })),
                  catchError(() => of(null))
                )
            ),
            catchError(() => of(null))
          );

        return forkJoin({
          group: this.api.get<GroupDTO>(`group/${course.groupId}`),
          subject: this.api.get<SubjectDTO>(`subject/${course.subjectId}`),
          teacherData: teacherRequest,
          tasks: of(tasks),
        }).pipe(
          map(({ group, subject, teacherData, tasks }) => {
            const taskList = tasks.filter(
              (t) => t.courseId === course.courseId
            );
            const nearestTask = this.getNearestTask(taskList);

            const teacherName = teacherData
              ? `${teacherData.personalData.lastname} ${
                  teacherData.personalData.name[0]
                }.${teacherData.personalData.patronymic?.[0] ?? ''}`
              : 'Преподаватель не указан';

            return {
              courseId: course.courseId,
              courseName: subject.subjectName,
              groupId: course.groupId,
              groupName: group.groupName,
              subjectId: subject.subjectId,
              subjectName: subject.subjectName,
              teacherId: course.teacherId,
              teacherName,
              hexademicalColor: subject.hexademicalColor,
              nearestTask,
            } as CourseViewModel;
          }),
          catchError((err) => {
            console.error('Error constructing CourseViewModel:', err);
            return of(null);
          })
        );
      })
    );
  }

  private getNearestTask(tasks: TaskDTO[]): TaskViewModel | undefined {
    const validTasks = tasks
      .filter(
        (task) =>
          task.taskStatus === TaskStatusEnum.Appointed &&
          new Date(task.dueTime) > new Date()
      )
      .sort(
        (a, b) => new Date(a.dueTime).getTime() - new Date(b.dueTime).getTime()
      );

    const task = validTasks[0];
    if (!task) return undefined;

    return {
      sidebarColor: '#FFA500',
      dueTime: task.dueTime,
      subjectName: '',
      teacherName: '',
      taskName: `Задание #${task.postId}`,
      taskStatus: task.taskStatus,
    };
  }

  private darkenColor(hex: string, amount: number): string {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);

    return `#${r.toString(16).padStart(2, '0')}${g
      .toString(16)
      .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  getPostViewModelsByCourse(courseId: number): Observable<PostViewModel[]> {
    return this.api.get<PostDTO[]>(`post/course/${courseId}`).pipe(
      switchMap((posts: PostDTO[]) => {
        const viewModelObservables = posts.map((post) => {
          return forkJoin({
            theme: this.getPostThemed(post.postThemeId),
            user: this.getTeacher(post.userId),
          }).pipe(
            switchMap(({ theme, user }) => {
              return this.getPersonalData(user.personalDataId!).pipe(
                map((personal) => {
                  const author = `${personal.lastname} ${personal.name} ${
                    personal.patronymic ?? ''
                  }`.trim();

                  const viewModel: PostViewModel = {
                    id: post.postId!,
                    title: post.postTitle,
                    description: post.postDescription,
                    theme: theme.postThemeText,
                    type: this.getPostTypeLabel(post.postType),
                    date: new Date().toISOString(), // заменить на реальную дату, если появится
                    author,
                    courseId: post.courseId,
                    courseName: '',
                    groupId: 0,
                    subjectId: 0,
                  };

                  return viewModel;
                })
              );
            })
          );
        });

        return forkJoin(viewModelObservables);
      })
    );
  }

  getPosts(courseId: number): Observable<PostDTO[]> {
    return this.api.get<PostDTO[]>(`/posts/course/${courseId}`);
  }

  getPostThemed(themeId: number): Observable<PostThemeDTO> {
    return this.api.get<PostThemeDTO>(`/postThemes/${themeId}`);
  }

  getTeacher(userId: number): Observable<UserBaseDTO> {
    return this.api.get<TeacherDTO>(`/Teacher/${userId}`);
  }

  getPersonalData(personalDataId: number): Observable<PersonalDataDTO> {
    return this.api.get<PersonalDataDTO>(`/personalData/${personalDataId}`);
  }

  getPostTypeLabel(type: PostTypeEnum): string {
    switch (type) {
      case PostTypeEnum.Post:
        return 'Публикация';
      case PostTypeEnum.AdditionalMaterials:
        return 'Дополнительные материалы';
      case PostTypeEnum.Survey:
        return 'Опрос';
      case PostTypeEnum.Task:
        return 'Задание';
      default:
        return 'Неизвестно';
    }
  }
}
