// src/app/student/student.routes.ts
import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { TimeTableComponent } from './pages/time-table/time-table.component';
import { CoursesDashboardComponent } from './pages/courses-dashboard/courses-dashboard.component';
import { CourseComponent } from './pages/course/course.component';
import { PostDetailComponent } from './pages/course/post-detail/post-detail.component';
import { PersonalComponent } from './pages/personal/personal.component';

export const studentRoutes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'timetable', component: TimeTableComponent },
  { path: 'courses', component: CoursesDashboardComponent },
  { path: 'personal', component: PersonalComponent },
  { path: 'course/:courseHash', component: CourseComponent },
  { path: 'course/:courseHash/posts', component: CourseComponent },
  { path: 'course/:courseHash/tasks', component: CourseComponent },
  { path: 'course/:courseHash/materials', component: CourseComponent },
  { path: 'course/:courseHash/:postHash', component: PostDetailComponent },
];
