import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';

@Component({
  selector: 'app-my-agents',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    Header, 
    Footer
  ],
  templateUrl: './mis-agentes.html',
  styleUrl: './mis-agentes.scss'
})
export class MyAgents implements OnInit {
  
  agents: any[] = [];
  loading = false;
  
  // Lógica del Chat
  selectedAgent: any = null; // El agente con el que chateamos
  messages: { role: 'user' | 'assistant', text: string }[] = [];
  userMessage = '';
  chatLoading = false;

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadMyAgents();
    }
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadMyAgents() {
    this.loading = true;
    this.http.get<any>('http://localhost:3001/agents/my-rentals', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (res) => {
          this.agents = res.agents || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  releaseAgent(agent: any, event: Event) {
    event.stopPropagation(); // Para que no abra el chat
    if(!confirm('¿Seguro que quieres dejar de usar este agente?')) return;

    this.http.post(`http://localhost:3001/agents/${agent._id}/release`, {}, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.agents = this.agents.filter(a => a._id !== agent._id);
          if (this.selectedAgent?._id === agent._id) this.closeChat();
          alert('Agente liberado.');
          this.cdr.detectChanges();
        },
        error: () => alert('Error al liberar agente')
      });
  }

  // --- CHAT LOGIC ---

  openChat(agent: any) {
    this.selectedAgent = agent;
    this.messages = []; // Limpiar chat previo o cargar historial si tuvieras
    // Mensaje de bienvenida fake
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
    
    // Auto-scroll
    setTimeout(() => this.scrollToBottom(), 100);

    // 2. Llamar al Backend (OpenAI)
    this.http.post<any>('http://localhost:3001/chat', {
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
        this.messages.push({ role: 'assistant', text: '⚠️ Error de conexión con el agente.' });
        this.chatLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  scrollToBottom() {
    const container = document.querySelector('.chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
  }
}