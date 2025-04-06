import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, HttpClientModule } from '@angular/common/http'; // Импортируем HttpClientModule
import { AuthorizationServiceService } from './app/modules/authorization/services/authorization-service.service';
import { JwtInterceptor } from './app/helper/jwt.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

bootstrapApplication(AppComponent).catch((err) => console.error(err));

bootstrapApplication(AppComponent, {
  providers: [
    // Подключаем HttpClientModule для работы с HTTP-запросами
    provideHttpClient(), // Добавляем нужные провайдеры для работы с HttpClient
    AuthorizationServiceService,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
}).catch((err) => console.error(err));
