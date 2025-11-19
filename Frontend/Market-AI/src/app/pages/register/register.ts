import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { User as userService } from '../../shared/services/user';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Location } from '@angular/common';
import { AuthService } from '../../shared/services/auth';


@Component({
  selector: 'app-register',
  imports: [FormsModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  form: FormGroup;

  constructor(private activatedRoute: ActivatedRoute, private fb: FormBuilder, private userService: userService, private location: Location, private auth: AuthService) {
    this.form = fb.group({
      Nombre: ['', [Validators.required, Validators.minLength(2)]],
      Correo: ['', [Validators.required, Validators.email]],
      Contraseña: ['', [Validators.required, Validators.minLength(8)]],
      Confirmar_contraseña: ['', [Validators.required, Validators.minLength(8)]],
      Terms: [false, Validators.requiredTrue]
    }, {validators: this.match('Contraseña', 'Confirmar_contraseña')});
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
          alert('Usuario registrado correctamente');
          console.log('Respuesta del servidor:', res);
        },
        error: (err) => {
          console.error('Error en registro:', err);
          const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message || 'Error desconocido');
          alert(`Ocurrió un error al registrar el usuario. Código: ${err.status || 'N/A'} - ${msg}`);
        }
      });
    } else {
      this.form.markAllAsTouched();
      alert('El formulario contiene errores, revisa los campos');
    }
  }

  registerWithGoogle() {
    const url = this.auth.getGoogleLoginUrl();
    window.location.href = url;
  }

}
