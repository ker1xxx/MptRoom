import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { jwtInterceptor } from './app/core/jwt.interceptor';
import { AppRoutingModule, routes } from './app/app-routing.module';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([jwtInterceptor]) // Configure HTTP client with interceptor
    ),
    provideRouter(routes), // Configure router
  ],
}).catch((err) => console.error(err));
