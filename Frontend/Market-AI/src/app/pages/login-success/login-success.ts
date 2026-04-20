import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../shared/services/auth';
import { MatDialog } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../login/popup-login';

@Component({
  selector: 'app-login-success',
  standalone: true,
  imports: [],
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
  private dialog = inject(MatDialog);

  ngOnInit(): void {
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
      this.openDialog('Inicio de sesion exitoso', 'success');
      this.router.navigate(['/home-page']);
    });
  }

  private openDialog(message: string, type: 'success' | 'error') {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type },
      panelClass: type === 'success' ? 'notify-success-dialog' : 'notify-error-dialog',
      position: { top: '80px' }
    });

    setTimeout(() => {
      ref.close();
    }, 4000);
  }
}
