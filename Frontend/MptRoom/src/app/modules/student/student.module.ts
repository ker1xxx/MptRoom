import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { StudentDashboardComponent } from './pages/student-dashboard/student-dashboard.component';

const routes: Routes = [{ path: '', component: StudentDashboardComponent }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class StudentModule {}
