import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth';
import { Location } from '@angular/common';
import { NotificationDialogComponent } from './popup-login';

@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  form: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private location: Location, private dialog: MatDialog) {
    this.form = this.fb.group({
      Correo: ['', [Validators.required, Validators.email]],
      Contrasena: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  onCancel(): void {
    this.location.back();
  }

  doOnSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.openDialog('El formulario contiene errores, revisa los campos', 'error');
      return;
    }

    const email = this.form.get('Correo')?.value;
    const password = this.form.get('Contrasena')?.value;

    this.loading = true;
    this.auth.login({ email, password }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        this.openDialog('Inicio de sesion exitoso', 'success');
        this.router.navigate(['/home-page']);
      },
      error: (err) => {
        console.error('Error al iniciar sesion', err);
        this.openDialog('Credenciales invalidas o error de conexion', 'error');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onForgotPassword(event: Event) {
    event.preventDefault();

    const control = this.form.get('Correo');
    if (!control || control.invalid) {
      control?.markAsTouched();
      this.openDialog('Ingresa un correo electrónico válido primero.', 'error');
      return;
    }

    const email = control.value;
    this.loading = true;

    this.auth.requestPasswordReset(email).subscribe({
      next: () => {
        this.openDialog(
          'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.',
          'success'
        );
      },
      error: (err) => {
        console.error('Error al solicitar recuperación de contraseña', err);
        this.openDialog(
          'Ocurrió un error al procesar la recuperación. Intenta más tarde.',
          'error'
        );
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  loginWithGoogle() {
    const url = this.auth.getGoogleLoginUrl('login');
    window.location.href = url;
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
