import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationServiceService } from '../modules/authorization/services/authorization-service.service';
import { inject } from '@angular/core';

export const TeacherGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthorizationServiceService);
  const router = inject(Router);

  const role = authService.getUserRole();

  if (authService.isLoggedIn() && role === 'Teacher') {
    return true; // Разрешаем доступ для администратора
  } else {
    router.navigate(['/forbidden']); // Перенаправляем на страницу ошибки доступа
    return false;
  }
};
