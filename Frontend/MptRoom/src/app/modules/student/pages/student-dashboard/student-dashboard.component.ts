import { Component } from '@angular/core';
import { StudentService } from '../../../../services/service.service';
import { HeaderComponent } from '../../../shared/header/header.component';
import { DashboardBodyComponent } from '../../components/dashboard-body/dashboard-body.component';
import { CommonModule } from '@angular/common';
import { forkJoin, map, Observable, Subject, switchMap } from 'rxjs';
import { StudentDTO } from '../../../../models/DTO/student.dto';
import { LessonViewModel } from '../../../../models/VM/lesson.viewmodel';
import { GradeViewModel } from '../../../../models/VM/grade.viewmodel';

@Component({
  standalone: true,
  selector: 'student-dashboard',
  imports: [CommonModule, HeaderComponent, DashboardBodyComponent],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent {
  user!: StudentDTO;
  schedule$!: Observable<LessonViewModel[]>;
  grades$!: Observable<GradeViewModel[]>;

  constructor(private studentService: StudentService) {}

  ngOnInit() {
    this.studentService.student$.subscribe((data) => {
      if (data) {
        this.user = data;

        this.loadSchedule();
        this.loadGrades();
      }
    });
  }

  private loadSchedule() {
    if (!this.user.UserId) return;

    this.schedule$ = this.studentService.getSchedule();
  }

  async loadGrades() {
    if (!this.user.UserId) return;

    // Получаем задания для текущего пользователя
    const grades = this.studentService.getTasksByUser(this.user.UserId).pipe(
      switchMap((tasks) => {
        // Запросы для получения информации по предмету для каждого задания
        const subjectRequest = tasks.map((task) =>
          this.studentService.getSubject(task.PostId!)
        );

        const postRequest = tasks.map((task) =>
          this.studentService.getTask(task.PostId!)
        );

        // Используем forkJoin для получения всех запросов
        return forkJoin([forkJoin(subjectRequest), forkJoin(postRequest)]).pipe(
          map(([subjects, posts]) => {
            // Преобразуем массив TaskDTO в массив GradeViewModel
            return tasks.map((task, index) => ({
              Subject: subjects[index].SubjectName, // Извлекаем данные о предмете
              Task: posts[index].PostTitle, // Делаем привязку к задаче
              Grade: task.Mark ? task.Mark.toString() : '0', // Убедитесь, что grade это строка
              Duedate: task.DueTime, // Дата сдачи задания
            }));
          })
        );
      })
    );
  }
}
