import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component'; // Импортируем AppComponent
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http'; // Импортируем HttpClientModule
import { provideHttpClient } from '@angular/common/http'; // Предоставляем HttpClient
import { AuthorizationServiceService } from './app/services/auth/authorization-service.service';
import { JwtInterceptor } from './app/helper/jwt.interceptor';

bootstrapApplication(AppComponent).catch((err) => console.error(err));

bootstrapApplication(AppComponent, {
  providers: [
    // Подключаем HttpClientModule для работы с HTTP-запросами
    provideHttpClient(), // Добавляем нужные провайдеры для работы с HttpClient
    AuthorizationServiceService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
}).catch((err) => console.error(err));
