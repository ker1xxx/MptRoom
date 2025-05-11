// src/app/app.component.ts
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './services/auth.service';
import { NotificationComponent } from './modules/shared/notification/notification.component';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet
    ><app-notification></app-notification>`,
  standalone: true,
  imports: [RouterModule, NotificationComponent],
})
export class AppComponent {
  constructor(private authService: AuthService, private router: Router) {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
    // if (authService.getUserRole() === 'Student') {
    //   this.studentService.loadUser().subscribe();
    // }
  }
}
