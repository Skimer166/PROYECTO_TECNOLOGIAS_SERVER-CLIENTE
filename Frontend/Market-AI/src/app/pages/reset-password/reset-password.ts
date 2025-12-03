import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../shared/services/auth';
import { MatDialog } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../login/popup-login';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  form: FormGroup;
  loading = false;
  token: string | null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private auth: AuthService,
    private dialog: MatDialog,
  ) {
    this.token = this.route.snapshot.queryParamMap.get('token');

    this.form = this.fb.group(
      {
        Contrasena: ['', [Validators.required, Validators.minLength(8)]],
        ConfirmarContrasena: ['', [Validators.required, Validators.minLength(8)]],
      },
      { validators: this.match('Contrasena', 'ConfirmarContrasena') },
    );
  }

  get hasToken(): boolean {
    return !!this.token;
  }

  private match(control: string, confirm: string) {
    return (group: FormGroup) => {
      const first = group.get(control);
      const second = group.get(confirm);

      if (!first || !second) return null;

      if (first.value === second.value) {
        second.setErrors(null);
        return null;
      }

      second.setErrors({ mismatch: true });
      return { mismatch: true };
    };
  }

  onCancel(): void {
    this.location.back();
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      this.openDialog('Revisa los campos o vuelve a solicitar el enlace.', 'error');
      return;
    }

    const newPassword = this.form.get('Contrasena')?.value;
    this.loading = true;

    this.auth.resetPassword(this.token, newPassword).subscribe({
      next: () => {
        this.openDialog('Contraseña actualizada, ahora puedes iniciar sesión.', 'success');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error al restablecer contraseña:', err);
        this.openDialog('Token inválido o expirado. Vuelve a solicitar el enlace.', 'error');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private openDialog(message: string, type: 'success' | 'error') {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type },
      panelClass: type === 'success' ? 'notify-success-dialog' : 'notify-error-dialog',
      position: { top: '80px' },
    });

    setTimeout(() => {
      ref.close();
    }, 4000);
  }
}

