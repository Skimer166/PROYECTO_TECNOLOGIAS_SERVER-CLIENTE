import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core'; // 1. IMPORTAR ChangeDetectorRef
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AuthService } from '../../shared/services/auth';
import { User as UserService } from '../../shared/services/user';
import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';
import { NotificationDialogComponent } from '../login/popup-login';
import { environment } from '../../shared/config';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
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
  rentedAgentsCount = 0;

  
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  
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
    this.loadRentedAgentsCount();

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
          next: (user: { name: string; email: string; avatar?: string }) => {
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
  private loadRentedAgentsCount() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

      this.http.get<{ agents: unknown[] }>(`${environment.apiUrl}/agents/my-rentals`, { headers }).subscribe({
      next: (res) => {
        const agents = res?.agents || [];
        this.rentedAgentsCount = agents.length;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando agentes rentados en perfil:', err);
      }
    });
  }

  triggerFileInput() {
    const fileInput = document.getElementById('avatarInput') as HTMLElement;
    if(fileInput) fileInput.click();
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    
    if (file && this.userId) {
      if (file.size > 5 * 1024 * 1024) {
        this.openAvatarSizeDialog('La imagen no puede pesar más de 5MB');
        return;
      }

      this.loading = true;
      
      this.userService.uploadAvatar(file).subscribe({
        next: (res) => {
          const backendUrl = environment.apiUrl;
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
      next: (res) => {
        if (res.token) {
          this.auth.setTokenFromOAuth(res.token);
        }

        this.openProfileDialog('Perfil actualizado correctamente', true);
        this.loading = false;
        this.cdr.detectChanges();
        
      },
      error: (err) => {
        console.error(err);
        this.openProfileDialog('Error al actualizar perfil', false);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  private openProfileDialog(message: string, success: boolean) {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type: success ? 'success' : 'error' },
      panelClass: success
        ? 'notify-profile-success-dialog'
        : 'notify-profile-error-dialog',
      position: { top: '80px' },
    });

    setTimeout(() => {
      ref.close();
    }, 3000);
  }

  private openAvatarSizeDialog(message: string) {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type: 'error' },
      panelClass: 'notify-avatar-size-dialog',
      position: { top: '80px' },
    });

    setTimeout(() => {
      ref.close();
    }, 3000);
  }
}
