// src/app/student/student.routes.ts
import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TimeTableComponent } from './pages/time-table/time-table.component';

export const studentRoutes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'timetable', component: TimeTableComponent },
];
