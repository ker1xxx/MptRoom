// src/app/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../environment/environment';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { Observable } from 'rxjs/internal/Observable';
import { throwError } from 'rxjs/internal/observable/throwError';
import { map, Subject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  public isRefreshing = false;
  public refreshSubject = new Subject<boolean>();

  constructor(private http: HttpClient, private router: Router) {}

  login(loginData: { login: string; password: string }) {
    return this.http.post(`${this.apiUrl}/login`, loginData, {
      withCredentials: true,
    });
  }

  logout() {
    document.cookie = `access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }
  isAccessTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    const decoded = jwtDecode<{ exp: number }>(token);
    return Date.now() >= decoded.exp * 1000;
  }

  scheduleTokenRefresh(): void {
    const token = this.getAccessToken();
    if (!token) return;

    const decoded = jwtDecode<{ exp: number }>(token);
    const expiresIn = decoded.exp * 1000 - Date.now() - 60000; // Обновляем за 1 минуту до истечения

    if (expiresIn > 0) {
      setTimeout(() => {
        this.refreshToken().subscribe();
      }, expiresIn);
    }
  }

  getAccessToken(): string | null {
    const match = document.cookie.match('(^|;)\\s*access_token=([^;]+)');
    return match ? match[2] : null;
  }

  getRefreshToken(): string | null {
    const match = document.cookie.match('(^|;)\\s*refresh_token=([^;]+)');
    return match ? match[2] : null;
  }

  refreshToken(): Observable<void> {
    return this.http
      .post<{
        accessToken: string;
        refreshToken: string;
      }>(
        `${this.apiUrl}/refresh`,
        {},
        {
          withCredentials: true,
        }
      )
      .pipe(
        tap({
          next: (response) => {
            // Обновляем только access token через куки
            document.cookie = `access_token=${response.accessToken}; path=/; max-age=3600`;
          },
          error: () => {
            this.logout();
          },
        }),
        map(() => void 0)
      );
  }

  getUserRole(): string | null {
    const token = this.getAccessToken();
    if (token) {
      const decoded: any = jwtDecode(token);
      return decoded[
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
      ];
    }
    return null;
  }

  getUserId(): number | null {
    const token = this.getAccessToken();
    if (token) {
      const decoded: any = jwtDecode(token);
      return Number(
        decoded[
          'http://schemas.microsoft.com/ws/2008/06/identity/claims/serialnumber'
        ]
      );
    }
    return null;
  }
}
