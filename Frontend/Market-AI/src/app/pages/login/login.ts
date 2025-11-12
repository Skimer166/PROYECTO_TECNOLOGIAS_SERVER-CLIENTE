import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { Location } from '@angular/common';


@Component({
  selector: 'app-login',
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  form: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private location: Location) {
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
      alert('El formulario contiene errores, revisa los campos');
      return;
    }

    const email = this.form.get('Correo')?.value;
    const password = this.form.get('Contrasena')?.value;

    this.loading = true;
    this.auth.login({ email, password }).subscribe({
      next: (res) => {
        localStorage.setItem('token', res.token);
        alert('Inicio de sesion exitoso');
        this.router.navigate(['/home-page']);
      },
      error: (err) => {
        console.error('Error al iniciar sesion', err);
        alert('Credenciales invalidas o error de conexion');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
