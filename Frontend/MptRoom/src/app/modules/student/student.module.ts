import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StudentDashboardComponent} from './pages/student-dashboard/student-dashboard.component'
import { StudentRoutingModule } from './student-routing.module';
import { HttpClientModule } from '@angular/common/http';


@NgModule({
  imports: [
    CommonModule,
    StudentRoutingModule,
    HttpClientModule
  ]
})
export class StudentModule {

 }