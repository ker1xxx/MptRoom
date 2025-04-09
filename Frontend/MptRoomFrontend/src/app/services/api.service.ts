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
      console.log('scheduleCache', this.scheduleCache$.value);
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

          return forkJoin([
            forkJoin(subjectRequests),
            forkJoin(teacherRequests),
            forkJoin(housingRequests),
            lessonSlotRequests,
          ]).pipe(
            switchMap(([subjects, teachers, housings, lessonSlots]) => {
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
                    console.log(lesson);

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
}
