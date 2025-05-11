// src/app/student/student.routes.ts
import { Routes } from '@angular/router';
import { TeacherDashboardComponent } from './pages/dashboard/dashboard.component';
import { TeacherTimeTableComponent } from './pages/time-table/time-table.component';
import { TeacherCourseDashboardComponent } from './pages/teacher-course-dashboard/teacher-course-dashboard.component';
import { CourseComponent } from './pages/course/course.component';
import { PostDetailComponent } from './pages/course/post-detail/post-detail.component';
import { MarksComponent } from './pages/course/post-detail/task-card/marks/marks.component';
import { TeacherPersonalComponent } from './pages/personal/personal.component';

export const teacherRoutes: Routes = [
  { path: '', component: TeacherDashboardComponent },
  { path: 'timetable', component: TeacherTimeTableComponent },
  { path: 'courses', component: TeacherCourseDashboardComponent },
  { path: 'course/:courseHash', component: CourseComponent },
  { path: 'course/:courseHash/posts', component: CourseComponent },
  { path: 'course/:courseHash/tasks', component: CourseComponent },
  { path: 'course/:courseHash/materials', component: CourseComponent },
  { path: 'course/:courseHash/:postHash', component: PostDetailComponent },
  { path: 'course/:courseHash/:postHash/marks', component: MarksComponent },
  { path: 'personal', component: TeacherPersonalComponent },
];
