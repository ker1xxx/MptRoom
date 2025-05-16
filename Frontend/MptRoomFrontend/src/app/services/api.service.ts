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
  Subject,
  switchMap,
  take,
  tap,
  throwError,
} from 'rxjs';
import { LessonSlotDTO } from '../models/DTO/lesson-slot.dto';
import { LessonDTO } from '../models/DTO/lesson.dto';
import { PersonalDataDTO } from '../models/DTO/personal-data.dto';
import { StudentDTO } from '../models/DTO/student.dto';
import { SubjectDTO } from '../models/DTO/subject.dto';
import { TeacherDTO } from '../models/DTO/teacher.dto';
import { DayOfWeekEnum } from '../models/enums/day-of-week.enum';
import { WeekTypeEnum } from '../models/enums/week-type.enum';
import { LessonViewModel } from '../models/VM/lesson.viewmodel';
import { environment } from '../../environment/environment';
import { AuthService } from './auth.service';
import { HousingDTO } from '../models/DTO/housing.dto';
import { GroupDTO } from '../models/DTO/group.dto';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = `${environment.apiUrl}/api`;

  private studentSubject = new BehaviorSubject<StudentDTO | null>(null);
  student$ = this.studentSubject.asObservable();

  private teacherSubject = new BehaviorSubject<TeacherDTO | null>(null);
  teacher$ = this.teacherSubject.asObservable();

  private scheduleCache$ = new BehaviorSubject<LessonViewModel[] | null>(null);
  private loading$ = new BehaviorSubject<boolean>(false);

  avatarUrlCache = new BehaviorSubject<SafeResourceUrl | string>(
    'assets/images/user_icon_not_found_100px.png'
  );

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
              //todo
            }
          })
        )
    );

    return data;
  }

  async getTeacher(): Promise<TeacherDTO> {
    const current = this.teacherSubject.getValue();
    if (current) {
      return current; // Вернем из кэша, если есть
    }
    const data = await firstValueFrom(
      this.http
        .get<TeacherDTO>(`${this.apiUrl}/Teacher/${this.auth.getUserId()}`)
        .pipe(
          tap((data) => {
            if (data) {
              this.teacherSubject.next(data); // кэшируем
            } else {
              console.error('Данные учителя пусты или не получены');
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
      return this.scheduleCache$.pipe(
        filter((schedule): schedule is LessonViewModel[] => !!schedule),
        take(1)
      );
    }

    this.loading$.next(true);

    return this.http
      .get<LessonDTO[]>(
        `${this.apiUrl}/Lesson/student/${this.auth.getUserId()}`,
        { withCredentials: true }
      )
      .pipe(
        switchMap((lessons) => {
          const subjectRequests = lessons.map((lesson) =>
            this.getById<SubjectDTO>('Subject', lesson.subjectId!)
          );
          const teacherRequests = lessons.map((lesson) =>
            this.getById<TeacherDTO>('Teacher', lesson.teacherId)
          );
          const housingRequests = lessons.map((lesson) =>
            this.getById<HousingDTO>('Housing', lesson.housingId)
          );
          const lessonSlotRequests = this.get<LessonSlotDTO[]>('LessonSlot');
          const groupRequests = lessons.map((lesson) =>
            this.getById<GroupDTO>('Group', lesson.groupId)
          );

          return forkJoin([
            forkJoin(subjectRequests),
            forkJoin(teacherRequests),
            forkJoin(housingRequests),
            forkJoin(groupRequests),
            lessonSlotRequests,
          ]).pipe(
            switchMap(([subjects, teachers, housings, groups, lessonSlots]) => {
              const viewModelRequests = lessons.map((lesson, index) =>
                from(
                  this.getById<PersonalDataDTO>(
                    'PersonalData',
                    teachers[index].personalDataId!
                  )
                ).pipe(
                  map((personalData) => {
                    const matchingSlot = lessonSlots.find(
                      (slot) => slot.lessonSlotId === lesson.lessonNumberId
                    );

                    return {
                      LessonId: lesson.lessonId!,
                      SubjectId: subjects[index].subjectId!,
                      SubjectName: subjects[index].subjectName,
                      GroupId: groups[index].groupId!,
                      GroupName: `${lesson.groupId}`,
                      TeacherId: lesson.teacherId!,
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

  getTeacherSchedule(
    forceRefresh: boolean = false
  ): Observable<LessonViewModel[]> {
    if (this.scheduleCache$.value && !forceRefresh) {
      return of(this.scheduleCache$.value);
    }

    if (this.loading$.value) {
      return this.scheduleCache$.pipe(
        filter((schedule): schedule is LessonViewModel[] => !!schedule),
        take(1)
      );
    }

    this.loading$.next(true);

    return this.http
      .get<LessonDTO[]>(
        `${this.apiUrl}/Lesson/teacher/${this.auth.getUserId()}`,
        { withCredentials: true }
      )
      .pipe(
        switchMap((lessons) => {
          const groupRequests = lessons.map((lesson) =>
            this.getById<GroupDTO>('Group', lesson.groupId)
          );
          const housingRequests = lessons.map((lesson) =>
            this.getById<HousingDTO>('Housing', lesson.housingId)
          );
          const subjectsRequests = lessons.map((lesson) =>
            this.getById<SubjectDTO>('Subject', lesson.subjectId)
          );
          const lessonSlotRequests = this.get<LessonSlotDTO[]>('LessonSlot');

          return forkJoin([
            forkJoin(groupRequests),
            forkJoin(housingRequests),
            forkJoin(subjectsRequests),
            lessonSlotRequests,
          ]).pipe(
            switchMap(([groups, housings, subjects, lessonSlots]) => {
              const viewModelRequests = lessons.map((lesson, index) => {
                const matchingSlot = lessonSlots.find(
                  (slot) => slot.lessonSlotId === lesson.lessonNumberId
                );
                return of({
                  LessonId: lesson.lessonId!,
                  SubjectId: subjects[index].subjectId!,
                  SubjectName: subjects[index].subjectName,
                  GroupId: groups[index].groupId!,
                  GroupName: groups[index].groupName,
                  TeacherId: lesson.teacherId!,
                  TeacherName: '',
                  DayOfWeek: DayOfWeekEnum[lesson.dayOfWeek],
                  WeekType: WeekTypeEnum[lesson.weekType],
                  LessonNumber: lesson.lessonNumberId,
                  HousingName: housings[index].housingName,
                  HexademicalColor: subjects[index].hexademicalColor,
                  LessonTime: matchingSlot
                    ? `${matchingSlot.lessonStart} - ${matchingSlot.lessonEnd}`
                    : 'Время не указано',
                });
              });

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

  deleteSubject(subject_id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Subject/${subject_id}`);
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`);
  }

  getById<T>(endpoint: string, id: number): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}/${id}`);
  }

  put<T>(endopoint: string, data: T, id: number): Observable<any> {
    return this.http.put<T>(`${this.apiUrl}/${endopoint}/${id}`, data);
  }

  post<T>(endopoint: string, data: T): Observable<any> {
    return this.http.post<T>(`${this.apiUrl}/${endopoint}`, data);
  }

  delete(endpoint: string, id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${endpoint}/${id}`);
  }
  getAdditionalMaterials(fileId: number) {
    return this.http.get(`${this.apiUrl}/AdditionalMaterial/upload/${fileId}`, {
      responseType: 'blob',
    });
  }

  async saveAvatar(
    personalDataId: number,
    sanitizer: DomSanitizer
  ): Promise<void> {
    const current = this.avatarUrlCache.value;
    if (current && current !== 'assets/images/user_icon_not_found_100px.png') {
      return; // Уже загружен — ничего не делаем
    }

    try {
      const blob = await firstValueFrom(this.getAvatar(personalDataId));
      if (blob.type.startsWith('image/')) {
        const blobUrl = URL.createObjectURL(blob);
        const safeUrl = sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
        this.avatarUrlCache.next(safeUrl);
      } else {
        this.avatarUrlCache.next('assets/images/user_icon_not_found_100px.png');
      }
    } catch (e) {
      console.error(e);
      this.avatarUrlCache.next('assets/images/user_icon_not_found_100px.png');
    }
  }

  getAvatar(personalDataId: number) {
    return this.http.get(
      `${this.apiUrl}/PersonalData/avatar/${personalDataId}`,
      {
        responseType: 'blob',
      }
    );
  }
}
