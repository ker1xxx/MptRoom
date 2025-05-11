// src/app/auth/login.component.ts
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      login: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    this.errorMessage = null; // Сбрасываем ошибку при новой попытке

    if (this.loginForm.valid) {
      const { login, password } = this.loginForm.value;
      this.auth.login({ login, password }).subscribe({
        next: (res) => {
          // Получаем роль из ответа сервера
          const role = this.auth.getUserRole();
          // Перенаправляем в зависимости от роли
          switch (role?.toLowerCase()) {
            case 'administrator':
              this.router.navigate(['/admin/students']);
              break;
            case 'teacher':
              this.router.navigate(['/teacher']);
              break;
            case 'student':
              this.router.navigate(['/student']);
              break;
            default:
              this.router.navigate(['/login']);
              console.error('Неизвестная роль:', role);
          }
        },
        error: (err) => {
          this.handleLoginError(err);
        },
      });
    }
  }

  private handleLoginError(err: any): void {
    if (err.status === 401) {
      this.errorMessage = 'Неверный логин или пароль';
    } else if (err.status === 0) {
      this.errorMessage = 'Ошибка соединения с сервером';
    } else {
      this.errorMessage = 'Произошла ошибка при авторизации';
    }

    // Покачиваем карточку при ошибке
    const card = document.querySelector('.login-card');
    card?.classList.add('shake-animation');
    setTimeout(() => card?.classList.remove('shake-animation'), 500);
  }
}
