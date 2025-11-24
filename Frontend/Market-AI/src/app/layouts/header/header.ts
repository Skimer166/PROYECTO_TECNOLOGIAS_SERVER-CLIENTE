import { Component, OnInit, Inject, ChangeDetectorRef, inject } from '@angular/core'; // 1. Importar ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from '../../shared/services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule
  ],
})
export class Header implements OnInit {
  isLoggedIn = false;
  userName: string | null = null;
  userPhoto: string | null = null;
  userCredits: number = 0;

  // detector de cambios
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  get isLandingPage(): boolean {
    return this.router.url.includes('landing-page');
  }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((logged) => {
      this.isLoggedIn = logged;
      if (logged) {
        this.loadUserDataFromToken();
      } else {
        this.userName = null;
        this.userPhoto = null;
        this.userCredits = 0;
      }
      
      this.cdr.detectChanges();
    });

    if (this.authService.hasToken()) {
      this.isLoggedIn = true;
      this.loadUserDataFromToken();
      this.cdr.detectChanges();
    }
  }

  private loadUserDataFromToken(): void {
    const token = this.authService.getToken();
    if (!token) return;

    const payload = this.decodeJwt(token);
    if (!payload) return;

    const fullName: string =
      payload.name ||
      (payload.email ? String(payload.email).split('@')[0] : '');
    const firstName = fullName.split(' ')[0];

    this.userName = firstName || null;
    this.userPhoto = payload.avatar || null;
    
    this.userCredits = payload.credits !== undefined ? payload.credits : 0;
    
  }

  
  private decodeJwt(token: string): any | null {
    if (typeof window === 'undefined') return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const binary = window.atob(base64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder('utf-8').decode(bytes));
    } catch {
      return null;
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/landing-page']);
  }
}