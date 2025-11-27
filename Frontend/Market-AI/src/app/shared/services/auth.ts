import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { SocketService } from './socket';

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
  private platformId = inject(PLATFORM_ID);

  private creditsSubject = new BehaviorSubject<number>(0);
  credits$ = this.creditsSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private socketService = inject(SocketService);

  constructor(private http: HttpClient) {
    if (this.hasToken()) {
      this.loadCreditsFromToken();
    }
  }

  updateCredits(newAmount: number) {
    this.creditsSubject.next(newAmount);
  }

  private loadCreditsFromToken() {
    const token = this.getToken();
    if (!token) return;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const credits = payload.credits !== undefined ? payload.credits : 0;
      this.creditsSubject.next(credits);
    } catch {
      this.creditsSubject.next(0);
    }
  }

  login(payload: any) {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, payload).pipe(
      tap((res) => {
        if (res?.token) {
          this.saveToken(res.token);
          this.isLoggedInSubject.next(true);
          this.loadCreditsFromToken(); 

          this.socketService.disconnect();
        }
      })
    );
  }


  logout() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user_role');
        localStorage.removeItem('user_role');
        this.socketService.disconnect();

        this.isLoggedInSubject.next(false);
        this.creditsSubject.next(0);
      } catch (e) {
        console.error('Error limpiando storage', e);
      }
    }

    // 2. Actualizar estado de la app
    this.isLoggedInSubject.next(false);
    this.creditsSubject.next(0); 
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
