import { Component } from '@angular/core';
import {
  Observable,
  switchMap,
  forkJoin,
  map,
  of,
  catchError,
  firstValueFrom,
  BehaviorSubject,
  shareReplay,
  take,
  tap,
} from 'rxjs';
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
import { encodeId } from '../../../../helper/util';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RussianDatePipe } from '../../../../helper/RussianDatePipe';
import { PostDTO } from '../../../../models/DTO/post.dto';

@Component({
  selector: 'app-courses-dashboard',
  imports: [HeaderComponent, CommonModule],
  templateUrl: './courses-dashboard.component.html',
  styleUrl: './courses-dashboard.component.scss',
})
export class CoursesDashboardComponent {
  constructor(
    private api: ApiService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  user$!: StudentDTO;
  courses$!: Observable<CourseViewModel[]>;
  selectedCourseId: number | null = null;

  avatarUrls: Map<number, BehaviorSubject<SafeResourceUrl | string>> =
    new Map();

  private avatarCache = new Map<
    number,
    BehaviorSubject<SafeResourceUrl | string>
  >();

  // Кэш для основных данных
  private cache = {
    groups: new Map<number, GroupDTO>(),
    subjects: new Map<number, SubjectDTO>(),
    teachers: new Map<number, PersonalDataDTO>(),
  };

  async ngOnInit() {
    this.api.student$.pipe(take(1)).subscribe(async (student) => {
      if (student) {
        this.user$ = student;
        this.courses$ = this.getCoursesWithTasks(this.user$.userId!).pipe(
          shareReplay(1)
        );
      }
    });
  }

  private getCoursesWithTasks(
    studentId: number
  ): Observable<CourseViewModel[]> {
    return forkJoin({
      courses: this.api.get<CourseDTO[]>(`course/student/${studentId}`).pipe(
        catchError(() => of([])),
        map((res) => (Array.isArray(res) ? res : []))
      ),
      tasks: this.api
        .get<TaskDTO[]>(`task/student/${studentId}`)
        .pipe(catchError(() => of([]))),
    }).pipe(
      switchMap(({ courses, tasks }) => {
        if (!courses.length) return of([]);

        return this.loadRequiredData(courses).pipe(
          map(({ groups, subjects, teachers }) =>
            this.mapCourses(courses, tasks, groups, subjects, teachers)
          )
        );
      })
    );
  }

  private loadRequiredData(courses: CourseDTO[]) {
    const groupIds = [...new Set(courses.map((c) => c.groupId))].filter(
      Boolean
    ) as number[];
    const subjectIds = [...new Set(courses.map((c) => c.subjectId))].filter(
      Boolean
    ) as number[];
    const teacherIds = [...new Set(courses.map((c) => c.teacherId))].filter(
      Boolean
    ) as number[];

    return forkJoin({
      groups: this.loadGroups(groupIds),
      subjects: this.loadSubjects(subjectIds),
      teachers: this.loadTeachers(teacherIds),
    });
  }

  private loadGroups(ids: number[]): Observable<GroupDTO[]> {
    const newIds = ids.filter((id) => !this.cache.groups.has(id));
    if (!newIds.length) return of([...this.cache.groups.values()]);

    return forkJoin(
      newIds.map((id) =>
        this.api.get<GroupDTO>(`group/${id}`).pipe(
          tap((group) => this.cache.groups.set(id, group)),
          catchError(() => of(null))
        )
      )
    ).pipe(map((groups) => groups.filter(Boolean) as GroupDTO[]));
  }

  private loadSubjects(ids: number[]): Observable<SubjectDTO[]> {
    const newIds = ids.filter((id) => !this.cache.subjects.has(id));
    if (!newIds.length) return of([...this.cache.subjects.values()]);

    return forkJoin(
      newIds.map((id) =>
        this.api.get<SubjectDTO>(`subject/${id}`).pipe(
          tap((subject) => this.cache.subjects.set(id, subject)),
          catchError(() => of(null))
        )
      )
    ).pipe(map((subjects) => subjects.filter(Boolean) as SubjectDTO[]));
  }

  private loadTeachers(ids: number[]): Observable<PersonalDataDTO[]> {
    const newIds = ids.filter((id) => !this.cache.teachers.has(id));
    if (!newIds.length) return of([...this.cache.teachers.values()]);

    return forkJoin(
      newIds.map((id) =>
        this.api.get<TeacherDTO>(`teacher/${id}`).pipe(
          switchMap((teacher) =>
            this.api
              .get<PersonalDataDTO>(`personaldata/${teacher.personalDataId}`)
              .pipe(
                tap((personalData) =>
                  this.cache.teachers.set(id, personalData)
                ),
                catchError(() => of(null))
              )
          ),
          catchError(() => of(null))
        )
      )
    ).pipe(map((teachers) => teachers.filter(Boolean) as PersonalDataDTO[]));
  }

  private mapCourses(
    courses: CourseDTO[],
    tasks: TaskDTO[],
    groups: GroupDTO[],
    subjects: SubjectDTO[],
    teachers: PersonalDataDTO[]
  ): CourseViewModel[] {
    return courses.map((course) => {
      const group = this.cache.groups.get(course.groupId!) ?? {
        groupId: course.groupId!,
        groupName: 'Нет данных',
      };
      const subject = this.cache.subjects.get(course.subjectId!) ?? {
        subjectId: course.subjectId!,
        subjectName: 'Нет данных',
        hexademicalColor: '#fffff',
      };
      const teacher = this.cache.teachers.get(course.teacherId!) ?? {
        name: '',
        lastname: 'Нет данных',
        patronymic: '',
      };

      return {
        courseId: course.courseId!,
        courseName: subject.subjectName,
        groupId: course.groupId!,
        groupName: group.groupName,
        subjectId: course.subjectId!,
        subjectName: subject.subjectName,
        teacherId: course.teacherId!,
        teacherName: `${teacher.lastname} ${teacher.name[0]}.${
          teacher.patronymic?.[0] ?? ''
        }`,
        hexademicalColor: subject.hexademicalColor || '#4CAF50',
        nearestTask: this.getNearestTask(
          tasks.filter((t) => t.courseId === course.courseId)
        ),
        avatar$: this.getTeacherAvatar(course.teacherId!),
      };
    });
  }

  private getTeacherAvatar(
    teacherId: number
  ): Observable<SafeResourceUrl | string> {
    if (!this.avatarCache.has(teacherId)) {
      const avatarSubject = new BehaviorSubject<SafeResourceUrl | string>(
        'assets/images/user_icon_not_found_100px.png'
      );
      this.avatarCache.set(teacherId, avatarSubject);

      this.api
        .get<TeacherDTO>(`teacher/${teacherId}`)
        .pipe(
          switchMap((teacher) =>
            teacher?.personalDataId
              ? this.api.getAvatar(teacher.personalDataId)
              : of(null)
          ),
          catchError(() => of(null))
        )
        .subscribe((blob) => {
          if (blob instanceof Blob && blob.type.startsWith('image/')) {
            const url = this.sanitizer.bypassSecurityTrustResourceUrl(
              URL.createObjectURL(blob)
            );
            avatarSubject.next(url);
          }
        });
    }
    return this.avatarCache.get(teacherId)!;
  }

  getAvatar(course: CourseDTO): Observable<SafeResourceUrl | string> {
    if (!this.avatarUrls.has(course.courseId!)) {
      this.getAvatarUrlForCourse(course); // Загружаем аватар, если его нет
    }
    return this.avatarUrls.get(course.courseId!)!;
  }

  getAvatarUrlForCourse(course: CourseDTO): void {
    if (this.avatarUrls.has(course.courseId!)) {
      return; // Если аватар уже загружен, не делаем повторный запрос
    }

    const avatarSubject = new BehaviorSubject<SafeResourceUrl | string>(
      'assets/images/user_icon_not_found_100px.png'
    );
    this.avatarUrls.set(course.courseId!, avatarSubject);

    this.api
      .getById<TeacherDTO>('Teacher', course.teacherId)
      .toPromise()
      .then((teacher) => {
        if (teacher?.personalDataId) {
          return this.api.getAvatar(teacher.personalDataId!).toPromise();
        }
        throw new Error('Нет личных данных преподавателя');
      })
      .then((blob) => {
        if (blob?.type.startsWith('image/')) {
          const blobUrl = URL.createObjectURL(blob);
          avatarSubject.next(
            this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl)
          );
        } else {
          avatarSubject.next('assets/images/user_icon_not_found_100px.png');
        }
      })
      .catch(() => {
        avatarSubject.next('assets/images/user_icon_not_found_100px.png');
      });
  }

  private mapToCourseViewModel(
    course: CourseDTO,
    group: GroupDTO,
    subject: SubjectDTO,
    personalData: PersonalDataDTO,
    task?: TaskViewModel
  ): CourseViewModel {
    const courseName = subject?.subjectName || `Курс ID: ${course.courseId}`;
    const avatarUrl$ = this.getAvatarUrlForCourse(course); // Это теперь Observable

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

  private mapToTaskViewModel(task: TaskDTO, title: string): TaskViewModel {
    return {
      postId: task.postId,
      sidebarColor: '#FFA500', // Пример цвета
      dueTime: task.dueTime,
      subjectName: '', // Будет заполнено позже
      teacherName: '', // Будет заполнено позже
      taskName: title,
      taskStatus: task.taskStatus,
      mark: task.mark,
      maxMark: task.maxMark,
      description: '',
      lastUpdate: task.lastUpdate,
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
    return validTasks[0]
      ? this.mapToTaskViewModel(
          validTasks[0],
          this.getTaskTitle(validTasks[0].postId)
        )
      : undefined;
  }

  getTaskTitle(postId: number): string {
    var title = '';
    this.api.getById<PostDTO>('Post', postId).subscribe((post) => {
      title = post.postTitle;
    });
    return title;
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
    const courseHash = encodeId(course!.courseId!);

    this.router.navigate(['student', 'course', courseHash]);
  }
}
