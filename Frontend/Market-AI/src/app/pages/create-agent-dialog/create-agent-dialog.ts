import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { NotificationDialogComponent } from '../login/popup-login';
import { environment } from '../../shared/config';

@Component({
  selector: 'app-create-agent-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './create-agent-dialog.html',
  styleUrl: './create-agent-dialog.scss'
})
export class CreateAgentDialogComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<CreateAgentDialogComponent>);
  private dialog = inject(MatDialog);

  //para imagen
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  form: FormGroup;
  loading = false;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      modelVersion: ['gpt-4o-mini', Validators.required],
      description: ['', Validators.required],
      instructions: ['', Validators.required],
      category: ['otros', Validators.required],
      language: ['es', Validators.required],
      pricePerHour: [10, [Validators.required, Validators.min(0)]],
      imageUrl: ['']
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 
      Authorization: token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '' 
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;

    const formData = new FormData();
  
    Object.keys(this.form.value).forEach(key => {
      const value = this.form.value[key];
      formData.append(key, value);
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile); 
    }

    this.http.post(`${environment.apiUrl}/agents`, formData, { 
      headers: this.getAuthHeaders() 
    })
    .subscribe({
      next: () => {
        this.openNotify('Agente creado exitosamente', true);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error(err);
        this.openNotify('Error al crear agente', false);
        this.loading = false;
      }
    });
  }

  close() {
    this.dialogRef.close(false);
  }

  private openNotify(message: string, success: boolean) {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type: success ? 'success' : 'error' },
      panelClass: success ? 'notify-success-dialog' : 'notify-error-dialog',
      position: { top: '80px' }
    });
    setTimeout(() => ref.close(), 3000);
  }
}