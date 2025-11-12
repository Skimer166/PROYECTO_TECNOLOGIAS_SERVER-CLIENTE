import { Component, OnDestroy, OnInit, Inject } from '@angular/core';
import { Router, NavigationEnd, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class Header implements OnInit, OnDestroy {
  isLoggedIn = false;
  isLandingPage = false;
  userName: string | null = null;
  userPhoto: string | null = null;

  private sub?: Subscription;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.refreshAuthState();
    this.updateLandingFlag(this.router.url);

    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.updateLandingFlag(e.urlAfterRedirects || e.url);
        this.refreshAuthState();
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private safeGet(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private safeRemove(key: string): void {
    if (!this.isBrowser) return;
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch {
     
    }
  }

  private refreshAuthState(): void {
    if (!this.isBrowser) {
      // En SSR no hay storage: asumimos no logueado para el render del servidor
      this.isLoggedIn = false;
      this.userName = null;
      this.userPhoto = null;
      return;
    }

    const token = this.safeGet('token');
    this.isLoggedIn = !!token;

    this.userName = this.safeGet('user_name');
    this.userPhoto = this.safeGet('user_photo');
  }

  private updateLandingFlag(url: string): void {
    this.isLandingPage = url.startsWith('/landing-page');
  }

  logout(): void {
    // Borra en ambos storages (solo en browser)
    this.safeRemove('token');
    this.safeRemove('user_name');
    this.safeRemove('user_photo');

    this.refreshAuthState();
    this.router.navigate(['/login']);
  }
}