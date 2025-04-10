import { Component } from '@angular/core';
import { Observable, switchMap, forkJoin, map, of, catchError } from 'rxjs';
import { CourseDTO } from '../../../../models/DTO/course.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { TaskStatusEnum } from '../../../../models/enums/task-status.enum';
import { CourseViewModel } from '../../../../models/VM/course.viewmode';
import { TaskViewModel } from '../../../../models/VM/task.viewmodel';
import { ApiService } from '../../../../services/api.service';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';
import { CollegeYearEnum } from '../../../../models/enums/college-year.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-courses-dashboard',
  imports: [HeaderComponent, CommonModule],
  templateUrl: './courses-dashboard.component.html',
  styleUrl: './courses-dashboard.component.scss',
})
export class CoursesDashboardComponent {
  constructor(private api: ApiService, private router: Router) {}

  user$!: StudentDTO;
  courses$!: Observable<CourseViewModel[]>;
  selectedCourseId: number | null = null;

  async ngOnInit() {
    await this.api.student$.subscribe((student) => {
      if (student) {
        this.user$ = student;
        this.courses$ = this.getCoursesWithTasks(this.user$.userId!);
      }
    });
  }

  getCoursesWithTasks(studentId: number): Observable<CourseViewModel[]> {
    return forkJoin({
      courses: this.api.get<CourseDTO[]>(`course/student/${studentId}`).pipe(
        catchError(() => of([] as CourseDTO[])),
        map((res) => (Array.isArray(res) ? res : []))
      ),
      tasks: this.api
        .get<TaskDTO[]>(`task/student/${studentId}`)
        .pipe(catchError(() => of([] as TaskDTO[]))),
    }).pipe(
      switchMap(({ courses, tasks }) => {
        if (!courses.length) return of([]);

        const teacherIds = [...new Set(courses.map((c) => c.teacherId))].filter(
          Boolean
        ) as number[];

        const teachersRequests = teacherIds.map((teacherId) =>
          this.api.get<TeacherDTO>(`teacher/${teacherId}`).pipe(
            switchMap((teacher) =>
              this.api
                .get<PersonalDataDTO>(`personaldata/${teacher.personalDataId}`)
                .pipe(
                  map((personalData) => ({ teacherId, personalData })),
                  catchError(() => of(null))
                )
            ),
            catchError(() => of(null))
          )
        );

        return forkJoin({
          groups: this.getGroupsForCourses(courses),
          subjects: this.getSubjectsForCourses(courses),
          teachers: forkJoin(teachersRequests),
          courses: of(courses),
          tasks: of(tasks),
        }) as Observable<{
          groups: GroupDTO[];
          subjects: SubjectDTO[];
          teachers: ({
            teacherId: number;
            personalData: PersonalDataDTO;
          } | null)[];
          courses: CourseDTO[];
          tasks: TaskDTO[];
        }>;
      }),
      map((data) => {
        // Явно проверяем тип данных
        if (Array.isArray(data)) {
          return [] as CourseViewModel[];
        }

        const { groups, subjects, teachers, courses, tasks } = data;

        // Добавляем проверки на существование массивов
        if (
          !Array.isArray(groups) ||
          !Array.isArray(subjects) ||
          !Array.isArray(teachers)
        ) {
          return courses.map((course) => this.mapToEmptyCourse(course));
        }

        const groupMap = new Map(groups.map((g: GroupDTO) => [g.groupId, g]));
        const subjectMap = new Map(
          subjects.map((s: SubjectDTO) => [s.subjectId, s])
        );
        const teacherMap = new Map(
          teachers
            .filter(
              (t): t is { teacherId: number; personalData: PersonalDataDTO } =>
                !!t
            )
            .map((t) => [t.teacherId, t.personalData])
        );

        return courses.map((course: CourseDTO) => {
          // Остальная логика остается прежней
          const group =
            groupMap.get(course.groupId!) ??
            ({
              groupId: course.groupId!,
              groupName: 'Нет данных',
              courseNumber: CollegeYearEnum.First,
            } as GroupDTO);

          const subject =
            subjectMap.get(course.subjectId) ??
            ({
              subjectId: course.subjectId,
              subjectName: 'Нет данных',
              hexademicalColor: '#CCCCCC',
            } as SubjectDTO);

          const personalData =
            teacherMap.get(course.teacherId!) ??
            ({
              personalDataId: course.teacherId,
              name: '',
              lastname: 'Нет данных',
              patronymic: '',
              phoneNumber: '',
              email: '',
            } as PersonalDataDTO);

          const courseTasks = tasks.filter(
            (t: TaskDTO) => t.courseId === course.courseId
          );
          const nearestTask = this.getNearestTask(courseTasks);

          return this.mapToCourseViewModel(
            course,
            group,
            subject,
            personalData,
            nearestTask
          );
        });
      })
    );
  }

  private mapToEmptyCourse(course: CourseDTO): CourseViewModel {
    return {
      courseId: course.courseId,
      courseName: 'Название недоступно',
      groupId: course.groupId,
      groupName: 'Группа не найдена',
      subjectId: course.subjectId,
      subjectName: 'Предмет не найден',
      teacherId: course.teacherId,
      teacherName: 'Преподаватель неизвестен',
      hexademicalColor: '#CCCCCC',
      nearestTask: undefined,
    };
  }

  private mapToCourseViewModel(
    course: CourseDTO,
    group: GroupDTO,
    subject: SubjectDTO,
    personalData: PersonalDataDTO,
    task?: TaskViewModel
  ): CourseViewModel {
    // Добавляем проверки для всех полей
    const courseName = subject?.subjectName || `Курс ID: ${course.courseId}`;

    const teacherName = personalData
      ? `${personalData.lastname} ${personalData.name[0]}.${
          personalData.patronymic?.[0] ?? ''
        }`
      : 'Преподаватель не указан';

    return {
      courseId: course.courseId ?? 0,
      courseName,
      groupId: course.groupId ?? 0,
      groupName: group?.groupName ?? `Группа ID: ${course.groupId}`,
      subjectId: course.subjectId ?? 0,
      subjectName: subject?.subjectName ?? 'Предмет не указан',
      teacherId: course.teacherId ?? 0,
      teacherName,
      hexademicalColor: subject?.hexademicalColor || '#4CAF50',
      nearestTask: task,
    };
  }

  private mapToTaskViewModel(task: TaskDTO): TaskViewModel {
    return {
      sidebarColor: '#FFA500', // Пример цвета
      dueTime: task.dueTime,
      subjectName: '', // Будет заполнено позже
      teacherName: '', // Будет заполнено позже
      taskName: `Задание #${task.postId}`,
      taskStatus: task.taskStatus,
    };
  }
  private getGroupsForCourses(courses: CourseDTO[]): Observable<GroupDTO[]> {
    const groupIds = [...new Set(courses.map((c) => c.groupId))];
    return forkJoin(
      groupIds.map((id) => this.api.get<GroupDTO>(`group/${id}`))
    );
  }

  private getSubjectsForCourses(
    courses: CourseDTO[]
  ): Observable<SubjectDTO[]> {
    const subjectIds = [...new Set(courses.map((c) => c.subjectId))];
    return forkJoin(
      subjectIds.map((id) => this.api.get<SubjectDTO>(`subject/${id}`))
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

    return validTasks[0] ? this.mapToTaskViewModel(validTasks[0]) : undefined;
  }

  getStatusText(status: TaskStatusEnum): string {
    return {
      [TaskStatusEnum.Appointed]: 'Назначено',
      [TaskStatusEnum.Submitted]: 'Сдано',
      [TaskStatusEnum.ReturnedWithMark]: 'Проверено',
      [TaskStatusEnum.DeadlineMissed]: 'Просрочено',
    }[status];
  }

  onCourseSelected(course: CourseViewModel): void {
    this.router.navigate(['student', 'course', course.courseId]);
  }
}
