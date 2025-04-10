// src/app/student/student.routes.ts
import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TimeTableComponent } from './pages/time-table/time-table.component';
import { CoursesDashboardComponent } from './pages/courses-dashboard/courses-dashboard.component';
import { CourseComponent } from './pages/course/course.component';

export const studentRoutes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'timetable', component: TimeTableComponent },
  { path: 'courses', component: CoursesDashboardComponent },
  { path: 'course/:courseId', component: CourseComponent },
];
