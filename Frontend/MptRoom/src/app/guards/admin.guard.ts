import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationServiceService } from '../modules/authorization/services/authorization-service.service';

export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthorizationServiceService);
  const router = inject(Router);

  const role = authService.getUserRole();

  if (authService.isLoggedIn() && role === 'Admin') {
    return true; // Разрешаем доступ для администратора
  } else {
    router.navigate(['/forbidden']); // Перенаправляем на страницу ошибки доступа
    return false;
  }
};
