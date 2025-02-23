import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {StudentModule} from '../app/modules/student/student.module'
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { StudentDashboardComponent } from './modules/student/pages/student-dashboard/student-dashboard.component';

@NgModule({
  imports: [BrowserModule, StudentModule, HttpClientModule],
})
export class AppModule { }