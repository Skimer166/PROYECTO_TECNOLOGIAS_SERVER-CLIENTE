import { Component, OnInit, OnDestroy, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';
import { SocketService } from '../../shared/services/socket';
import { NotificationDialogComponent } from '../login/popup-login';
import { CuadroDeConfirmacionComponent } from './cuadro-de-confirmacion';

import { environment } from '../../shared/config';

@Component({
  selector: 'app-my-agents',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    RouterModule,
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    Header, 
    Footer
  ],
  // Asegúrate de que estos nombres coincidan con tus archivos (my-agents vs mis-agentes)
  templateUrl: './mis-agentes.html', 
  styleUrl: './mis-agentes.scss'
})
export class MyAgents implements OnInit, OnDestroy {
  
  agents: any[] = [];
  loading = false;
  
  // Lógica del Chat
  selectedAgent: any = null;
  messages: { role: 'user' | 'assistant', text: string }[] = [];
  userMessage = '';
  chatLoading = false;
  
  // Variable para el intervalo
  private timerInterval: any;
  private agentTimeEndedSub?: Subscription;

  // Inyecciones
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private socketService = inject(SocketService);
  private dialog = inject(MatDialog);

  constructor() {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadMyAgents();
      
      // Iniciar el cronómetro (cada 1 segundo)
      this.timerInterval = setInterval(() => {
        this.updateCountdowns();
      }, 1000);

      this.agentTimeEndedSub = this.socketService
        .onAgentTimeEnded()
        .subscribe(({ agentId, name }) => {
          //alert(`Tu tiempo con el agente "${name}" ha terminado`);
          this.loadMyAgents();
        });
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.agentTimeEndedSub?.unsubscribe();
  }

  getAuthHeaders() {
    // Asegúrate de que el token exista
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadMyAgents() {
    this.loading = true;
    // Ajusta el puerto (3000 o 3001) según tu backend
    this.http.get<any>(`${environment.apiUrl}/agents/my-rentals`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          this.agents = res.agents || [];
          this.updateCountdowns(); // Calcular tiempos inmediatamente
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando mis agentes:', err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  releaseAgent(agent: any, event: Event) {
    event.stopPropagation(); // Evita abrir el chat al hacer clic en eliminar

    const ref = this.dialog.open(CuadroDeConfirmacionComponent, {
      data: { message: '¿Seguro que quieres dejar de usar este agente?' },
      panelClass: 'confirm-release-dialog',
      position: { top: '80px' },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

        this.http.post(`${environment.apiUrl}/agents/${agent._id}/release`,{},{ headers: this.getAuthHeaders() })        
        .subscribe({
          next: () => {
            // Filtrar la lista localmente para que desaparezca sin recargar
            this.agents = this.agents.filter((a) => a._id !== agent._id);

            // Si teníamos abierto el chat de este agente, lo cerramos
            if (this.selectedAgent?._id === agent._id) {
              this.closeChat();
            }

            this.openReleaseResultDialog('Agente liberado.', true);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error(err);
            this.openReleaseResultDialog('Error al liberar agente', false);
          },
        });
    });
  }

  // --- CHAT LOGIC ---

  openChat(agent: any) {
    this.selectedAgent = agent;
    this.messages = []; 
    // Mensaje de bienvenida simulado
    this.messages.push({ role: 'assistant', text: `¡Hola! Soy ${agent.name}. ${agent.description}. ¿En qué te ayudo hoy?` });
  }

  closeChat() {
    this.selectedAgent = null;
  }

  sendMessage() {
    if (!this.userMessage.trim() || !this.selectedAgent) return;

    // 1. Agregar mensaje usuario
    const text = this.userMessage;
    this.messages.push({ role: 'user', text });
    this.userMessage = '';
    this.chatLoading = true;
    
    // Auto-scroll hacia abajo
    setTimeout(() => this.scrollToBottom(), 100);

    // 2. Llamar al Backend (OpenAI)
    this.http.post<any>(`${environment.apiUrl}/chat`, {
      agentId: this.selectedAgent._id,
      message: text
    }, { headers: this.getAuthHeaders() }).subscribe({
      next: (res) => {
        this.messages.push({ role: 'assistant', text: res.response });
        this.chatLoading = false;
        setTimeout(() => this.scrollToBottom(), 100);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.messages.push({ role: 'assistant', text: 'Error de conexión con el agente.' });
        this.chatLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  scrollToBottom() {
    const container = document.querySelector('.chat-messages') as HTMLElement | null;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  // Actualización de contadores de tiempo
  updateCountdowns() {
    const now = new Date().getTime();
    
    this.agents.forEach(agent => {
      if (!agent.rentedUntil) return;
      
      const end = new Date(agent.rentedUntil).getTime();
      const diff = end - now;

      if (diff <= 0) {
        agent.timeLeftDisplay = "Expirado";
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        agent.timeLeftDisplay = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }
    });
    
    // Forzar actualización de vista
    this.cdr.detectChanges();
  }
  private openReleaseResultDialog(message: string, success: boolean) {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type: success ? 'success' : 'error' },
      panelClass: success
        ? 'notify-release-success-dialog'
        : 'notify-release-error-dialog',
      position: { top: '80px' },
    });

    setTimeout(() => {
      ref.close();
    }, 4000);
  }
}

