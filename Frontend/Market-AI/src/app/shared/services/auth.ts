import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user?: any; 
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:3001';

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  login(payload: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, payload).pipe(
      tap((res) => {
        if (res?.token) {
          this.saveToken(res.token);
          this.isLoggedInSubject.next(true);
        }
      })
    );
  }

  logout() {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
    } catch {}
    this.isLoggedInSubject.next(false);
  }

  private saveToken(token: string) {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      sessionStorage.setItem('token', token);
      localStorage.setItem('token', token);
    } catch {}
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return sessionStorage.getItem('token') || localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  getGoogleLoginUrl(): string {
    return `${this.baseUrl}/auth/google`;
  }

  setTokenFromOAuth(token: string) {
    this.saveToken(token);
    this.isLoggedInSubject.next(true);
  }
}
