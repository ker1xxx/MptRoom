import { Component } from '@angular/core';
import { StudentService } from '../../service.service';
import { StudentModel } from '../../../../DTO/student.model';
import { ScheduleModel } from '../../../../DTO/schedule.model';
import { GradesModel } from '../../../../DTO/grades.model';
import { HeaderComponent } from '../../components/shared/header/header.component';
import { DashboardBodyComponent } from '../../components/dashboard-body/dashboard-body.component';
import { HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { LessonModel } from '../../../../DTO/lessons.model';

@Component({
  standalone: true,
  selector: 'student-dashboard',
  imports: [
    CommonModule,
    HeaderComponent,
    DashboardBodyComponent,
    HttpClientModule,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss',
})
export class StudentDashboardComponent {
  user!: StudentModel;
  schedule$: Observable<ScheduleModel[]>;
  grades$: Observable<GradesModel[]>;

  constructor(private studentService: StudentService) {
    this.grades$ = this.studentService.getGrades();
    this.schedule$ = this.studentService.getSchedule();
  }

  ngOnInit() {
    this.studentService.getStudent().subscribe((data) => {
      this.user = data;
      localStorage.setItem('user', JSON.stringify(this.user));
    });
    this.grades$.subscribe((grades) => {
      console.log('Оценки: ', grades);
    });
    this.schedule$.subscribe((schedule) => {
      console.log('расписание: ', schedule);
    });
  }
}
