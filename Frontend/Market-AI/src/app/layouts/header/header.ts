import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

// Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu'; // <--- NUEVO IMPORT
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../shared/services/auth';
import { User } from '../../shared/types/user';
import { AddCreditsDialogComponent } from '../../pages/add-credits-dialog/add-credits-dialog';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule,
    MatMenuModule, 
    MatDialogModule,
    MatDividerModule
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header implements OnInit {
  isLoggedIn = false;
  isLandingPage = false;
  userName: string | null = null;
  userPhoto: string | null = null;
  userCredits: number = 0;

  private auth = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  ngOnInit(): void {
    // Detectar si es Landing Page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isLandingPage = event.url === '/' || event.url === '/landing-page' || event.url.includes('#');
    });

    // Subscribirse al estado del usuario (incluyendo créditos actualizados)
    this.auth.user$.subscribe((user: User | null) => {
      this.isLoggedIn = !!user;
      if (user) {
        this.userName = user.name;
        this.userPhoto = user.image || null;
        this.userCredits = user.credits || 0;
      } else {
        this.userName = null;
        this.userPhoto = null;
        this.userCredits = 0;
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  openRechargeDialog() {
    this.dialog.open(AddCreditsDialogComponent, {
      width: '400px'
    });
  }
}