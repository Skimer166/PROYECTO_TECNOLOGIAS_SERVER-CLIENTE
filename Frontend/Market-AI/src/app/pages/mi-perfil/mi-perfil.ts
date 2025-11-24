import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// servicios
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
    const token = this.auth.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.userId = payload.id || payload.sub;
      
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
          },
          error: (err) => {
            console.error(err);
            this.loading = false;
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
    fileInput.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.userId) {
      this.loading = true;
      this.userService.uploadAvatar(file).subscribe({
        next: (res: any) => {

          const newAvatarUrl = res.url || `https://tu-bucket-s3.amazonaws.com/${res.key}`; 
          
          this.currentAvatar = newAvatarUrl;
          this.form.patchValue({ avatar: newAvatarUrl });
          this.loading = false;
        },
        error: (err) => {
          console.error('Error subiendo imagen', err);
          alert('Error al subir la imagen');
          this.loading = false;
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
        alert('Perfil actualizado correctamente');
        this.loading = false;
        // Opcional: Recargar página o actualizar Header
        window.location.reload(); 
      },
      error: (err) => {
        console.error(err);
        alert('Error al actualizar perfil');
        this.loading = false;
      }
    });
  }
}