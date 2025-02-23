import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StudentModel } from '../../DTO/student.model';
import { ScheduleModel } from '../../DTO/schedule.model';
import { GradesModel } from '../../DTO/grades.model';
import { LessonModel } from '../../DTO/lessons.model';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private apiUrl = 'http://localhost:3000'; // URL мок-сервера

  constructor(private http: HttpClient) {}

  getStudent(): Observable<StudentModel> {
    return this.http.get<StudentModel>(`${this.apiUrl}/student`);
  }

  getSchedule(): Observable<ScheduleModel[]> {
    return this.http.get<ScheduleModel[]>(`${this.apiUrl}/schedule`);
  }

  getGrades(): Observable<GradesModel[]> {
    return this.http.get<GradesModel[]>(`${this.apiUrl}/grades`);
  }

  getLessons(): Observable<LessonModel[]> {
    return this.http.get<LessonModel[]>(`${this.apiUrl}/lessons`);
  }
}
