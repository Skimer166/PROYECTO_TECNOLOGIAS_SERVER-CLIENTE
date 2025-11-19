// src/app/auth/login-success.ts (o login-success.component.ts, como lo tengas)
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/services/auth'; // AJUSTA LA RUTA

@Component({
  selector: 'app-login-success',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-success">
      <p>Procesando inicio de sesión con Google...</p>
    </div>
  `,
})
export class LoginSuccess implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    // 👇 EVITAR EJECUCIÓN EN SSR (Node)
    if (typeof window === 'undefined') {
      return;
    }

    this.route.queryParamMap.subscribe((params) => {
      const token = params.get('token');

      if (!token) {
        this.router.navigate(['/login'], {
          queryParams: { error: 'missing_token' },
        });
        return;
      }

      this.authService.setTokenFromOAuth(token);

      const stored = sessionStorage.getItem('token') || localStorage.getItem('token');
      this.router.navigate(['/home-page']);
    });
  }
}
