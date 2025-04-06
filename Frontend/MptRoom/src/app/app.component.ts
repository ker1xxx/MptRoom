import { Component } from '@angular/core';
import {
  RouterModule,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationError,
} from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthorizationServiceService } from './modules/authorization/services/authorization-service.service';
import { LoginComponent } from './modules/authorization/login/login.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterModule, HttpClientModule, LoginComponent],
})
export class AppComponent {
  constructor(
    private authService: AuthorizationServiceService,
    private router: Router
  ) {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        console.log('Начало навигации:', event);
      } else if (event instanceof NavigationEnd) {
        console.log('Завершение навигации:', event);
      } else if (event instanceof NavigationError) {
        console.error('Ошибка навигации:', event);
      }
    });
  }
}
