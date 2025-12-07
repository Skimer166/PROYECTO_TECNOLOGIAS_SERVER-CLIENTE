import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider'; 
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../shared/config';
@Component({
  selector: 'app-add-credits-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatButtonModule, 
    MatInputModule, MatFormFieldModule, MatIconModule, MatSliderModule
  ],
  templateUrl: `./add-credits-dialog.html`,
  styleUrls: [`./add-credits-dialog.scss`]
})
export class AddCreditsDialogComponent {
  amount = 100; 
  loading = false;
  
  private http = inject(HttpClient);
  
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  goToCheckout() {
    this.loading = true;
    
    this.http.post<any>(`${environment.apiUrl}/payments/create-checkout-session`, { amount: this.amount }, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          // Redirigir a Stripe
          window.location.href = res.url; 
        },
        error: (err) => {
          console.error(err);
          alert('Error al conectar con Stripe');
          this.loading = false;
        }
      });
  }
}