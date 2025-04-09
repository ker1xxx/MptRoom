// src/app/auth/auth.guard.ts
import { inject, Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  authService = inject(AuthService);
  router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // 1. Проверка аутентификации
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    // 2. Проверка роли
    const requiredRole = route.data['role'];
    const userRole = this.authService.getUserRole();

    if (requiredRole && userRole !== requiredRole) {
      // Перенаправляем на страницу доступа или обратно на логин
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
