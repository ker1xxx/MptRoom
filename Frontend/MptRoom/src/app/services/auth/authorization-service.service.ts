import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationServiceService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(loginData: { login: string; password: string }) {
    return this.http.post(`${this.apiUrl}/login`, loginData, {
      withCredentials: true,
    });
  }

  logout() {
    document.cookie = `access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    const match = document.cookie.match('(^|;)\\s*access_token=([^;]+)');
    return match ? match[2] : null;
  }
}
