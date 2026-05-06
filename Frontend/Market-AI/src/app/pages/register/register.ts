import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { User as userService } from '../../shared/services/user';
import { HttpClientModule } from '@angular/common/http';
import { Location } from '@angular/common';
import { AuthService } from '../../shared/services/auth';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NotificationDialogComponent } from '../login/popup-login';
@Component({
  selector: 'app-register',
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private userService = inject(userService);
  private location = inject(Location);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  form: FormGroup;
  private static emailUsedErrorHandled = false;
  private currentDialogRef?: MatDialogRef<NotificationDialogComponent>;

  constructor() {
    this.form = this.fb.group(
      {
      Nombre: ['', [Validators.required, Validators.minLength(2)]],
      Correo: ['', [Validators.required, Validators.email]],
      Contraseña: ['', [Validators.required, Validators.minLength(8)]],
      Confirmar_contraseña: ['', [Validators.required, Validators.minLength(8)]],
      Terms: [false, Validators.requiredTrue]
    }, {validators: this.match('Contraseña', 'Confirmar_contraseña')});
  }

  ngOnInit(): void {
    // Mostrar errores que vengan desde el backend (por ejemplo, email ya usado en Google)
    this.activatedRoute.queryParamMap.subscribe((params) => {
      const error = params.get('error');

      if (error === 'email_already_used' && !Register.emailUsedErrorHandled) {
        Register.emailUsedErrorHandled = true;
        this.openDialog(
          'Este correo ya está registrado. Inicia sesión con esa cuenta.',
          'error'
        );
      }
    });
  }

  private match(control: string, confirm: string) {
    return (group: FormGroup) => {
      const contraseña = group.get(control);
      const conf_contraseña = group.get(confirm);

      if (!contraseña || !conf_contraseña) return null;

      if (contraseña.value === conf_contraseña.value) {
        //limpia el error de mismatch
        conf_contraseña.setErrors(null);
        return null;
      }

      //asigna mismatch
      conf_contraseña.setErrors({ mismatch: true });
      return { mismatch: true };
    };
  }

  onCancel(): void {
    this.location.back();
  }
  doOnSubmit() {
    if (this.form.valid) {
      const { Nombre, Correo, Contraseña } = this.form.value;
      const payload = { name: Nombre, email: Correo, password: Contraseña };
        this.userService.registerUser(payload).subscribe({
        next: (res) => {
          console.log('Respuesta del servidor:', res);
          this.openDialog('Usuario registrado correctamente', 'success', '/login');
        },
        error: (err) => {
          console.error('Error en registro:', err);
          const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || 'Error desconocido');
          this.openDialog(
            `Ocurrió un error al registrar el usuario. Código: ${err.status || 'N/A'} - ${msg}`,
            'error'
          );
        },
      });
    } else {
      this.form.markAllAsTouched();
      alert('El formulario contiene errores, revisa los campos');
    }
  }

  registerWithGoogle() {
    const url = this.auth.getGoogleLoginUrl('register');
    window.location.href = url;
  }

  private openDialog(message: string, type: 'success' | 'error', redirectUrl?: string) {
    // Cerrar cualquier diálogo previo para evitar que se muestren dos veces seguidas
    if (this.currentDialogRef) {
      this.currentDialogRef.close();
    }

    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type },
      panelClass: type === 'success' ? 'notify-success-dialog' : 'notify-error-dialog',
      position: { top: '80px' }
    });

    this.currentDialogRef = ref;

    const duration = redirectUrl ? 2000 : 2500;

    setTimeout(() => {
      if (this.currentDialogRef === ref) {
        ref.close();
        this.currentDialogRef = undefined;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      }
    }, duration);
  }
}
