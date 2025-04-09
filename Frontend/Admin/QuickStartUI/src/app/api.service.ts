import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  filter,
  firstValueFrom,
  forkJoin,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { StudentDTO } from './models copy/DTO/student.dto';
import { LessonViewModel } from './models copy/VM/lesson.viewmodel';
import { AuthService } from './pages/authentication/auth.service';
import { GroupDTO } from './models copy/DTO/group.dto';
import { HousingDTO } from './models copy/DTO/housing.dto';
import { LessonSlotDTO } from './models copy/DTO/lesson-slot.dto';
import { LessonDTO } from './models copy/DTO/lesson.dto';
import { PersonalDataDTO } from './models copy/DTO/personal-data.dto';
import { PostDTO } from './models copy/DTO/post.dto';
import { SubjectDTO } from './models copy/DTO/subject.dto';
import { TaskDTO } from './models copy/DTO/task.dto';
import { TeacherDTO } from './models copy/DTO/teacher.dto';
import { DayOfWeekEnum } from './models copy/enums/day-of-week.enum';
import { WeekTypeEnum } from './models copy/enums/week-type.enum';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = `${environment.apiUrl}/api`;

  private studentSubject = new BehaviorSubject<StudentDTO | null>(null);
  student$ = this.studentSubject.asObservable();

  private scheduleCache$ = new BehaviorSubject<LessonViewModel[] | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private auth: AuthService) {}

  async getStudent(): Promise<StudentDTO> {
    const current = this.studentSubject.getValue();
    if (current) {
      return current; // Вернем из кэша, если есть
    }

    const data = await firstValueFrom(
      this.http
        .get<StudentDTO>(`${this.apiUrl}/Student/${this.auth.getUserId()}`)
        .pipe(
          tap((data) => {
            if (data) {
              this.studentSubject.next(data); // кэшируем
            } else {
              console.error('Данные студента пусты или не получены');
            }
          })
        )
    );

    return data;
  }

  getSchedule(forceRefresh: boolean = false): Observable<LessonViewModel[]> {
    if (this.scheduleCache$.value && !forceRefresh) {
      return of(this.scheduleCache$.value);
    }

    if (this.loading$.value) {
      // Если уже идет загрузка — ждём появления данных
      return this.scheduleCache$.pipe(
        filter((schedule): schedule is LessonViewModel[] => !!schedule),
        take(1)
      );
    }

    this.loading$.next(true);

    return this.http
      .get<LessonDTO[]>(`${this.apiUrl}/Lesson`, { withCredentials: true })
      .pipe(
        switchMap((lessons) => {
          const subjectRequests = lessons.map((lesson) =>
            this.getSubject(lesson.subjectId!)
          );
          const teacherRequests = lessons.map((lesson) =>
            this.getTeacher(lesson.teacherId)
          );
          const housingRequests = lessons.map((lesson) =>
            this.getHousing(lesson.housingId)
          );
          const lessonSlotRequests = this.getLessonSlots();

          return forkJoin([
            forkJoin(subjectRequests),
            forkJoin(teacherRequests),
            forkJoin(housingRequests),
            lessonSlotRequests,
          ]).pipe(
            switchMap(([subjects, teachers, housings, lessonSlots]) => {
              const viewModelRequests = lessons.map((lesson, index) =>
                from(this.getPersonalData(teachers[index].personalDataId)).pipe(
                  map((personalData) => {
                    const matchingSlot = lessonSlots.find(
                      (slot) => slot.lessonSlotId === lesson.lessonNumberId
                    );

                    return {
                      LessonId: lesson.lessonId!,
                      SubjectName: subjects[index].subjectName,
                      GroupName: `${lesson.groupId}`,
                      TeacherName:
                        `${personalData.lastname} ${personalData.name[0]}.` +
                        (personalData.patronymic
                          ? ` ${personalData.patronymic[0]}.`
                          : ''),
                      DayOfWeek: DayOfWeekEnum[lesson.dayOfWeek],
                      WeekType: WeekTypeEnum[lesson.weekType],
                      LessonNumber: lesson.lessonNumberId,
                      HousingName: housings[index].housingName,
                      HexademicalColor: subjects[index].hexademicalColor,
                      LessonTime: matchingSlot
                        ? `${matchingSlot.lessonStart} - ${matchingSlot.lessonEnd}`
                        : 'Время не указано',
                    };
                  })
                )
              );

              return forkJoin(viewModelRequests);
            })
          );
        }),
        tap((schedule) => {
          this.scheduleCache$.next(schedule);
          this.loading$.next(false);
        }),
        catchError((err) => {
          this.loading$.next(false);
          return throwError(() => err);
        })
      );
  }

  clearScheduleCache() {
    this.scheduleCache$.next(null);
  }

  async getSubject(subject_id: number): Promise<SubjectDTO> {
    return await firstValueFrom(
      this.http.get<SubjectDTO>(`${this.apiUrl}/Subject/${subject_id}`)
    );
  }

  async getTeacher(teacher_id: number): Promise<TeacherDTO> {
    return await firstValueFrom(
      this.http.get<TeacherDTO>(`${this.apiUrl}/Teacher/${teacher_id}`)
    );
  }

  async getPersonalData(personal_data_id: number): Promise<PersonalDataDTO> {
    return await firstValueFrom(
      this.http.get<PersonalDataDTO>(
        `${this.apiUrl}/PersonalData/${personal_data_id}`
      )
    );
  }

  async getGroupData(group_id: number): Promise<GroupDTO> {
    return await firstValueFrom(
      this.http.get<GroupDTO>(`${this.apiUrl}/Group/${group_id}`)
    );
  }

  getTasksByUser(user_id: number): Observable<TaskDTO[]> {
    return this.http.get<TaskDTO[]>(`${this.apiUrl}/Task/student/${user_id}`);
  }

  async getPost(post_id: number): Promise<PostDTO> {
    return await firstValueFrom(
      this.http.get<PostDTO>(`${this.apiUrl}/Post/${post_id}`)
    );
  }

  getLessonSlots(): Observable<LessonSlotDTO[]> {
    return this.http.get<LessonSlotDTO[]>(`${this.apiUrl}/LessonSlot`);
  }

  async getHousing(housing_id: number): Promise<HousingDTO> {
    return await firstValueFrom(
      this.http.get<HousingDTO>(`${this.apiUrl}/Housing/${housing_id}`)
    );
  }

  async getSujbectByLesson(lesson_id: number): Promise<SubjectDTO> {
    return await firstValueFrom(
      this.http.get<SubjectDTO>(`${this.apiUrl}/Subject/${lesson_id}`)
    );
  }
}
