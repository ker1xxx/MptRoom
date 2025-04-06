// src/app/student/student.routes.ts
import { Routes } from '@angular/router';
import { UsersPageComponent } from './pages/users-page/users-page.component';

export const adminRoutes: Routes = [
  { path: '', component: UsersPageComponent },
];
