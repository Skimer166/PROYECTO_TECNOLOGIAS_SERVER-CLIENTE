import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../shared/services/auth'; // Para actualizar creditos locales
import { environment } from '../../shared/config';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: `./payment-success.html`,
  styleUrls: [`./payment-success.scss`]
})
export class PaymentSuccessComponent implements OnInit {
  verifying = true;
  success = false;
  error = '';

  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService); // con esto actualizamos creditos

  ngOnInit() {
    // Obtener session_id de la URL
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    
    if (sessionId) {
      this.verify(sessionId);
    } else {
      this.verifying = false;
      this.error = 'No se encontró información del pago.';
    }
  }

  verify(sessionId: string) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post<any>(`${environment.apiUrl}/payments/verify-success`, { session_id: sessionId }, { headers })
      .subscribe({
        next: (res) => {
          this.verifying = false;
          this.success = true;
          // Actualizar créditos en el servicio de Auth para que el header se actualice
          this.auth.updateCredits(res.newCredits); 
        },
        error: (err) => {
          this.verifying = false;
          this.error = 'Hubo un error verificando el pago.';
        }
      });
  }

  goHome() {
    this.router.navigate(['/home-page']);
  }
}