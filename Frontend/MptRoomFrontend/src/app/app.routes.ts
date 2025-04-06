// src/app/app.routes.ts
import { provideRouter, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NgModule } from '@angular/core';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./modules/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'student',
    loadChildren: () =>
      import('./modules/student/student.routes').then((m) => m.studentRoutes),
    canActivate: [AuthGuard],
    data: { role: 'Student' },
  },
  {
    path: 'teacher',
    loadChildren: () =>
      import('./modules/teacher/teacher.routes').then((m) => m.teacherRoutes),
    canActivate: [AuthGuard],
    data: { role: 'Teacher' },
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./modules/admin/admin.routes').then((m) => m.adminRoutes),
    canActivate: [AuthGuard],
    data: { role: 'Administrator' },
  },
  { path: '**', redirectTo: 'login' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
