// src/app/student/student.routes.ts
import { Routes } from '@angular/router';
import { UsersPageComponent } from './pages/users-page/users-page.component';
import { GroupPageComponent } from './pages/group-page/group-page.component';
import { SubjectPageComponent } from './pages/subject-page/subject-page.component';
import { TeacherPageComponent } from './pages/teacher-page/teacher-page.component';
import { CoursePageComponent } from './pages/course-page/course-page.component';
import { LessonScheduleComponent } from './pages/lesson-page/lesson-page.component';
import { PostsPageComponent } from './pages/course-page/posts-page/posts-page.component';

export const adminRoutes: Routes = [
  { path: 'groups', component: GroupPageComponent },
  { path: 'students', component: UsersPageComponent },
  { path: 'subjects', component: SubjectPageComponent },
  { path: 'teachers', component: TeacherPageComponent },
  { path: 'courses', component: CoursePageComponent },
  { path: 'lessons', component: LessonScheduleComponent },
  { path: 'posts', component: PostsPageComponent },
];
