// src/app/helper/jwt.interceptor.ts
import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import {
  catchError,
  filter,
  finalize,
  Subject,
  switchMap,
  take,
  throwError,
} from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const refreshInProgress$ = new Subject<boolean>();

  // Функция для обновления токена с блокировкой параллельных запросов
  const handleRefresh = () => {
    if (authService.isRefreshing) {
      return authService.refreshSubject.pipe(
        filter((result) => result),
        take(1),
        switchMap(() =>
          next(addTokenToRequest(req, authService.getAccessToken()!))
        )
      );
    }

    authService.isRefreshing = true;
    return authService.refreshToken().pipe(
      switchMap(() => {
        authService.refreshSubject.next(true);
        return next(addTokenToRequest(req, authService.getAccessToken()!));
      }),
      catchError((refreshError) => {
        authService.refreshSubject.next(false);
        if (refreshError.status === 401 || refreshError.status === 403) {
          authService.logout();
          router.navigate(['/login']);
        }
        return throwError(() => refreshError);
      }),
      finalize(() => {
        authService.isRefreshing = false;
      })
    );
  };

  // Пропускаем аутентификационные запросы
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  // Добавляем токен к запросу
  const authReq = addTokenToRequest(req, authService.getAccessToken());

  return next(authReq).pipe(
    catchError((error) => {
      // Обрабатываем только 401 ошибки
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // Если нет refresh токена - разлогиниваем
      if (!authService.getRefreshToken()) {
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => new Error('No refresh token'));
      }

      // Пытаемся обновить токен
      return handleRefresh();
    })
  );
};

// Вспомогательная функция для добавления токена в заголовки
const addTokenToRequest = (
  req: HttpRequest<unknown>,
  token: string | null
): HttpRequest<unknown> => {
  return token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
};
