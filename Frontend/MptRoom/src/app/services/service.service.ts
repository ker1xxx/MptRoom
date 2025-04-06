import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  BehaviorSubject,
  ObservedValueOf,
  forkJoin,
  Subject,
  firstValueFrom,
  from,
} from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { StudentDTO } from '../models/DTO/student.dto';
import { PersonalDataDTO } from '../models/DTO/personal-data.dto';
import { GroupDTO } from '../models/DTO/group.dto';
import { TaskDTO } from '../models/DTO/task.dto';
import { LessonViewModel } from '../models/VM/lesson.viewmodel';
import { LessonDTO } from '../models/DTO/lesson.dto';
import { DayOfWeekEnum } from '../models/enums/day-of-week.enum';
import { WeekTypeEnum } from '../models/enums/week-type.enum';
import { SubjectDTO } from '../models/DTO/subject.dto';
import { TeacherDTO } from '../models/DTO/teacher.dto';
import { PostDTO } from '../models/DTO/post.dto';
import { LessonSlotDTO } from '../models/DTO/lesson-slot.dto';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private apiUrl = 'http://localhost:5198/api'; // URL API

  private studentSubject = new BehaviorSubject<StudentDTO | null>(null);
  student$ = this.studentSubject.asObservable();

  constructor(private http: HttpClient) {}

  getStudent(): Observable<StudentDTO> {
    return this.http.get<StudentDTO>(`${this.apiUrl}/Student`).pipe(
      tap((data) => this.studentSubject.next(data)) // Кэшируем данные
    );
  }

  getSchedule(): Observable<LessonViewModel[]> {
    return this.http.get<LessonDTO[]>(`${this.apiUrl}/Lesson`).pipe(
      switchMap((lessons) => {
        const subjectRequests = lessons.map((lesson) =>
          this.getSubject(lesson.LessonId!)
        );
        const teacherRequests = lessons.map((lesson) =>
          this.getTeacher(lesson.TeacherId)
        );
        const housingRequests = lessons.map((lesson) =>
          this.http.get<{ id: number; name: string }>(
            `${this.apiUrl}/housings/${lesson.HousingId}`
          )
        );

        const lessonSlotRequests = this.getLessonSlots();

        return forkJoin([
          forkJoin(subjectRequests),
          forkJoin(teacherRequests),
          forkJoin(housingRequests),
          lessonSlotRequests,
        ]).pipe(
          switchMap(([subjects, teachers, housings, lessonSlots]) => {
            const lessonViewModelRequests = lessons.map((lesson, index) =>
              from(this.getPersonalData(teachers[index].PersonalDataId)).pipe(
                map((personalData) => {
                  // Получаем соответствующий LessonSlot для данного урока
                  const matchingLessonSlot = lessonSlots.find(
                    (slot) => slot.LessonSlotId === lesson.LessonNumberId
                  );

                  return {
                    LessonId: lesson.LessonId!,
                    SubjectName: subjects[index].SubjectName,
                    GroupName: `${lesson.GroupId}`,
                    TeacherName: `${personalData.Lastname} ${
                      personalData.Name[0]
                    }. ${
                      personalData.Patronymic
                        ? personalData.Patronymic[0] + '.'
                        : ''
                    }`,
                    DayOfWeek: DayOfWeekEnum[lesson.DayOfWeek],
                    WeekType: WeekTypeEnum[lesson.WeekType],
                    LessonNumber: lesson.LessonNumberId,
                    HousingName: housings[index].name,
                    HexademicalColor: subjects[index].HexademicalColor,
                    LessonTime: matchingLessonSlot
                      ? `${matchingLessonSlot.LessonStart} - ${matchingLessonSlot.LessonEnd}`
                      : 'Время не указано',
                  };
                })
              )
            );

            return forkJoin(lessonViewModelRequests);
          })
        );
      })
    );
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

  async getTask(task_id: number): Promise<PostDTO> {
    return await firstValueFrom(
      this.http.get<PostDTO>(`${this.apiUrl}/Post/${task_id}`)
    );
  }

  getLessonSlots(): Observable<LessonSlotDTO[]> {
    return this.http.get<LessonSlotDTO[]>(`${this.apiUrl}/LessonSlot`);
  }
}
