import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { jwtInterceptor } from './app/helper/jwt.interceptor';
import { ApiService } from './app/services/api.service';
import { APP_INITIALIZER } from '@angular/core';
import { AuthService } from './app/services/auth.service';

export function initializeApp(api: ApiService, auth: AuthService) {
  return () => {
    // Ensure `auth` is injected properly and `getUserRole` is not undefined.
    if (auth && auth.getUserRole() === 'Student') {
      return api.getStudent(); // Fetch student data only if the role is Student
    }
    if (auth && auth.getUserRole() === 'Teacher') {
      return api.getTeacher();
    } else {
      return null;
    }
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([jwtInterceptor]) // Configure HTTP client with interceptor
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ApiService, AuthService], // Add AuthService here for dependency injection
      multi: true,
    },
    provideRouter(appRoutes), // Configure router
  ],
}).catch((err) => console.error(err));
