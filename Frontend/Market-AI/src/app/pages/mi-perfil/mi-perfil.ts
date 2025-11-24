import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core'; // 1. IMPORTAR ChangeDetectorRef
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../shared/services/auth';
import { User as UserService } from '../../shared/services/user';
import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatInputModule, 
    MatFormFieldModule, 
    MatIconModule,
    MatProgressSpinnerModule,
    Header,
    Footer
  ],
  templateUrl: './mi-perfil.html',
  styleUrl: './mi-perfil.scss'
})
export class MyProfile implements OnInit {
  
  form: FormGroup;
  loading = false;
  userId: string | null = null;
  currentAvatar: string | null = null;
  
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  // 2. INYECTAR EL DETECTOR DE CAMBIOS
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}],
      avatar: [''] 
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    if (!isPlatformBrowser(this.platformId)) {
      return; 
    }

    const token = this.auth.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Ajuste para leer 'sub' o 'id' por si acaso
      this.userId = payload.sub || payload.id;
      
      if(this.userId) {
        this.loading = true;
        this.userService.getUserById(this.userId).subscribe({
          next: (user: any) => {
            this.form.patchValue({
              name: user.name,
              email: user.email,
              avatar: user.avatar
            });
            this.currentAvatar = user.avatar;
            this.loading = false;
            
            // 3. ACTUALIZAR VISTA MANUALMENTE
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error(err);
            this.loading = false;
            this.cdr.detectChanges(); // Actualizar en error también
          }
        });
      }
    } catch (e) {
      console.error('Error leyendo token', e);
      this.router.navigate(['/login']);
    }
  }

  triggerFileInput() {
    const fileInput = document.getElementById('avatarInput') as HTMLElement;
    if(fileInput) fileInput.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    
    if (file && this.userId) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede pesar más de 5MB');
        return;
      }

      this.loading = true;
      
      this.userService.uploadAvatar(file).subscribe({
        next: (res: any) => {
          const backendUrl = 'http://localhost:3001'; 
          // Ajusta según lo que retorne tu backend (res.id es lo esperado)
          const newAvatarUrl = `${backendUrl}/files/${res.id}/download`; 
          
          console.log('Imagen subida. Nueva URL:', newAvatarUrl);

          this.currentAvatar = newAvatarUrl;
          this.form.patchValue({ avatar: newAvatarUrl });
          this.form.markAsDirty(); // Marcar formulario como sucio para habilitar el botón "Guardar"
          
          this.loading = false;

          // 4. ACTUALIZAR VISTA MANUALMENTE (Esto soluciona tu problema)
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error detallado:', err);
          
          if (err.status === 500) {
            alert('Error del servidor. Revisa credenciales S3.');
          } else if (err.status === 401) {
            alert('Error de sesión. Intenta reconectar tu cuenta.');
          } else {
            alert('Error al subir la imagen.');
          }
          
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  saveProfile() {
    if (this.form.invalid || !this.userId) return;

    this.loading = true;
    const updateData = {
      name: this.form.get('name')?.value,
      avatar: this.form.get('avatar')?.value
    };

    this.userService.updateUser(this.userId, updateData).subscribe({
      next: (res: any) => {
        if (res.token) {
          this.auth.setTokenFromOAuth(res.token); 
        }

        alert('Perfil actualizado correctamente');
        this.loading = false;
        this.cdr.detectChanges();
        
      },
      error: (err) => {
        console.error(err);
        alert('Error al actualizar perfil');
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}