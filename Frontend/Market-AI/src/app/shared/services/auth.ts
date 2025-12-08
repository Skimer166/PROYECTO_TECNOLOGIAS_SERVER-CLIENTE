import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { SocketService } from './socket';
import { environment } from '../config'; 
import { User } from '../types/user'; 

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.apiUrl; 
  private platformId = inject(PLATFORM_ID);

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  private creditsSubject = new BehaviorSubject<number>(0);
  credits$ = this.creditsSubject.asObservable();

  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  
  private socketService = inject(SocketService);

  constructor(private http: HttpClient) {
    if (this.hasToken()) {
      this.loadUserFromToken();
    }
  }

  updateCredits(newAmount: number) {
    this.creditsSubject.next(newAmount);
    const currentUser = this.userSubject.value;
    if (currentUser) {
      this.userSubject.next({ ...currentUser, credits: newAmount });
    }
  }

  private loadUserFromToken() {
    const token = this.getToken();
    if (!token) {
      this.userSubject.next(null);
      this.creditsSubject.next(0);
      return;
    }
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      
      const user: User = {
        id: payload.id || payload.sub,
        name: payload.name, 
        email: payload.email,
        image: payload.image || payload.picture,
        credits: payload.credits || 0,
        role: payload.role
      };

      this.userSubject.next(user);
      this.creditsSubject.next(user.credits || 0);
      
    } catch (e) {
      console.error('Error decodificando token', e);
      this.userSubject.next(null);
      this.creditsSubject.next(0);
    }
  }

  login(payload: any) {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, payload).pipe(
      tap((res) => {
        if (res?.token) {
          this.saveToken(res.token);
          this.isLoggedInSubject.next(true);
          this.loadUserFromToken(); 
          this.socketService.reconnect();
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
      } catch (e) {
        console.error('Error limpiando storage', e);
      }
    }

    this.isLoggedInSubject.next(false);
    this.userSubject.next(null);
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

  getGoogleLoginUrl(mode: 'login' | 'register' = 'login'): string {
    return `${this.baseUrl}/auth/google?mode=${mode}`;
  }

  setTokenFromOAuth(token: string) {
    this.saveToken(token);
    this.isLoggedInSubject.next(true);
    this.loadUserFromToken(); 
    this.socketService.reconnect();
  }

  requestPasswordReset(email: string) {
    return this.http.post(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.baseUrl}/auth/reset-password`, { token, newPassword });
  }
}