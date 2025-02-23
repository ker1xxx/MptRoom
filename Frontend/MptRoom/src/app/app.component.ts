import { Component } from '@angular/core';
import { StudentDashboardComponent } from "./modules/student/pages/student-dashboard/student-dashboard.component";
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [StudentDashboardComponent, HttpClientModule]
})
export class AppComponent {
}
