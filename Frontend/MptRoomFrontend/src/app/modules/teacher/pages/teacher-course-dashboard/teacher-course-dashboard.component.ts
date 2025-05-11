import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, forkJoin, catchError, of, map, switchMap } from 'rxjs';
import { encodeId } from '../../../../helper/util';
import { CourseDTO } from '../../../../models/DTO/course.dto';
import { GroupDTO } from '../../../../models/DTO/group.dto';
import { PersonalDataDTO } from '../../../../models/DTO/personal-data.dto';
import { SubjectDTO } from '../../../../models/DTO/subject.dto';
import { TaskDTO } from '../../../../models/DTO/task.dto';
import { TeacherDTO } from '../../../../models/DTO/teacher.dto';
import { CollegeYearEnum } from '../../../../models/enums/college-year.enum';
import { CourseViewModel } from '../../../../models/VM/course.viewmode';
import { ApiService } from '../../../../services/api.service';
import { HeaderComponent } from '../../shared/header/header.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teacher-course-dashboard',
  imports: [HeaderComponent, CommonModule],
  templateUrl: './teacher-course-dashboard.component.html',
  styleUrl: './teacher-course-dashboard.component.scss',
})
export class TeacherCourseDashboardComponent {
  constructor(private api: ApiService, private router: Router) {}

  user$!: TeacherDTO;
  courses$!: Observable<CourseViewModel[]>;
  selectedCourseId: number | null = null;

  async ngOnInit() {
    await this.api.teacher$.subscribe((teacher) => {
      if (teacher) {
        this.user$ = teacher;
        this.courses$ = this.getCourses(this.user$.userId!);
      }
    });
  }

  getCourses(teacherId: number): Observable<CourseViewModel[]> {
    return forkJoin({
      courses: this.api
        .get<CourseDTO[]>(`course/teacher/${teacherId}`)
        .pipe(
          catchError(() => of([] as CourseDTO[])),
          map((res) => (Array.isArray(res) ? res : []))
        )
        .pipe(catchError(() => of([] as TaskDTO[]))),
    }).pipe(
      switchMap(({ courses }) => {
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
          return this.mapToCourseViewModel(course, group, subject);
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
    subject: SubjectDTO
  ): CourseViewModel {
    // Добавляем проверки для всех полей
    const courseName = subject?.subjectName || `Курс ID: ${course.courseId}`;
    return {
      courseId: course.courseId ?? 0,
      courseName,
      groupId: course.groupId ?? 0,
      groupName: group?.groupName ?? `Группа ID: ${course.groupId}`,
      subjectId: course.subjectId ?? 0,
      subjectName: subject?.subjectName ?? 'Предмет не указан',
      teacherId: course.teacherId ?? 0,
      teacherName: '',
      hexademicalColor: subject?.hexademicalColor || '#4CAF50',
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

  onCourseSelected(course: CourseViewModel): void {
    const courseHash = encodeId(course!.courseId!);

    this.router.navigate(['teacher', 'course', courseHash]);
  }
}
