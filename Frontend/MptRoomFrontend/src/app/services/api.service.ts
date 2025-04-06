import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  firstValueFrom,
  forkJoin,
  from,
  map,
  Observable,
  switchMap,
  tap,
} from 'rxjs';
import { GroupDTO } from '../models/DTO/group.dto';
import { LessonSlotDTO } from '../models/DTO/lesson-slot.dto';
import { LessonDTO } from '../models/DTO/lesson.dto';
import { PersonalDataDTO } from '../models/DTO/personal-data.dto';
import { PostDTO } from '../models/DTO/post.dto';
import { StudentDTO } from '../models/DTO/student.dto';
import { SubjectDTO } from '../models/DTO/subject.dto';
import { TaskDTO } from '../models/DTO/task.dto';
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

  constructor(private http: HttpClient, private auth: AuthService) {}

  async getStudent(): Promise<StudentDTO> {
    return await firstValueFrom(
      this.http
        .get<StudentDTO>(`${this.apiUrl}/Student/${this.auth.getUserId()}`)
        .pipe(
          tap((data) => {
            if (data) {
              console.log(`data ${data}`);
              this.studentSubject.next(data);
            } else {
              console.error('Данные студента пусты или не получены');
            }
          })
        )
    );
  }

  getSchedule(): Observable<LessonViewModel[]> {
    return this.http.get<LessonDTO[]>(`${this.apiUrl}/Lesson`).pipe(
      switchMap((lessons) => {
        if (!lessons) {
          throw new Error('Уроки не получены');
        }

        console.log('Lessons:', lessons); // Логирование всех уроков

        const subjectRequests = lessons.map((lesson) => {
          console.log('LessonId:', lesson.subjectId); // Логирование LessonId
          return this.getSubject(lesson.subjectId!); // Возможно, LessonId == undefined
        });
        const teacherRequests = lessons.map((lesson) => {
          console.log('TeacherId:', lesson.teacherId); // Логирование TeacherId
          return this.getTeacher(lesson.teacherId); // Возможно, TeacherId == undefined
        });

        const housingRequests = lessons.map((lesson) => {
          console.log('housingId:', lesson.housingId);
          return this.getHousing(lesson.housingId);
        });

        const lessonSlotRequests = this.getLessonSlots();

        return forkJoin([
          forkJoin(subjectRequests),
          forkJoin(teacherRequests),
          forkJoin(housingRequests),
          lessonSlotRequests,
        ]).pipe(
          switchMap(([subjects, teachers, housings, lessonSlots]) => {
            const lessonViewModelRequests = lessons.map((lesson, index) =>
              from(this.getPersonalData(teachers[index].personalDataId)).pipe(
                map((personalData) => {
                  // Получаем соответствующий LessonSlot для данного урока
                  const matchingLessonSlot = lessonSlots.find(
                    (slot) => slot.lessonSlotId === lesson.lessonNumberId
                  );
                  console.log(housings);

                  return {
                    LessonId: lesson.lessonId!,
                    SubjectName: subjects[index].subjectName,
                    GroupName: `${lesson.groupId}`,
                    TeacherName: `${personalData.lastname} ${
                      personalData.name[0]
                    }. ${
                      personalData.patronymic
                        ? personalData.patronymic[0] + '.'
                        : ''
                    }`,
                    DayOfWeek: DayOfWeekEnum[lesson.dayOfWeek],
                    WeekType: WeekTypeEnum[lesson.weekType],
                    LessonNumber: lesson.lessonNumberId,
                    HousingName: housings[index].housingName,
                    HexademicalColor: subjects[index].hexademicalColor,
                    LessonTime: matchingLessonSlot
                      ? `${matchingLessonSlot.lessonStart} - ${matchingLessonSlot.lessonEnd}`
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
