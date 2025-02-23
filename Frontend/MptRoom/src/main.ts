import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component'; // Импортируем AppComponent
import { HttpClientModule } from '@angular/common/http'; // Импортируем HttpClientModule
import { provideHttpClient } from '@angular/common/http'; // Предоставляем HttpClient

bootstrapApplication(AppComponent).catch(err => console.error(err));

bootstrapApplication(AppComponent, {
  providers: [ // Подключаем HttpClientModule для работы с HTTP-запросами
    provideHttpClient(), // Добавляем нужные провайдеры для работы с HttpClient
  ]
}).catch(err => console.error(err));