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

@Component({
  selector: 'app-login',
  template: `
    <h1>Авторизация</h1>
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <input type="text" formControlName="login" placeholder="Логин" required />
      <input
        type="password"
        formControlName="password"
        placeholder="Пароль"
        required
      />
      <button type="submit" [disabled]="loginForm.invalid">Войти</button>
    </form>
  `,
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
})
export class LoginComponent {
  loginForm: FormGroup;

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
    if (this.loginForm.valid) {
      const { login, password } = this.loginForm.value;
      this.auth.login({ login, password }).subscribe({
        next: (res) => {
          const role = this.auth.getUserRole();
          if (role) {
            this.router.navigate([role.toLowerCase()]);
          } else {
            console.error('Не удалось извлечь роль из токена');
          }
        },
        error: (err) => console.error('Ошибка авторизации', err),
      });
    }
  }
}
