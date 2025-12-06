import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';


import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card'; 

import { NotificationDialogComponent } from '../login/popup-login';
import { MatDialog } from '@angular/material/dialog'; // para el popup

interface AdminAgent {
  _id: string;
  name: string;
  description: string;
  category?: string;
  pricePerHour?: number;
  availability?: boolean;
}

@Component({
  selector: 'app-admin-agents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './admin-agents.html',
  styleUrls: ['./admin-agents.scss']
})
export class AdminAgentsComponent implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog); 
  private cdr = inject(ChangeDetectorRef);

  agents: AdminAgent[] = [];
  loading = false;
  error: string | null = null;

  editingAgentId: string | null = null;
  editName = '';
  editDescription = '';

  deletingAgentId: string | null = null;

  ngOnInit(): void {
    this.loadAgents();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) return new HttpHeaders();
    const value = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    return new HttpHeaders({ Authorization: value });
  }

  loadAgents(): void {
    this.loading = true;
    this.error = null;

    this.http.get<{ agents: AdminAgent[] }>('http://localhost:3001/agents', {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (res) => {
          this.agents = res.agents || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar agentes:', err);
          this.error = 'No se pudieron cargar los agentes.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  startEdit(agent: AdminAgent): void {
    // Si ya estaba borrando, cancelo el borrado
    this.deletingAgentId = null;
    
    this.editingAgentId = agent._id;
    this.editName = agent.name;
    this.editDescription = agent.description || '';
  }

  cancelEdit(): void {
    this.editingAgentId = null;
  }

  saveEdit(agent: AdminAgent): void {
    if (!this.editingAgentId) return;

    const body = {
      name: this.editName,
      description: this.editDescription,
    };

    this.http.put<AdminAgent>(`http://localhost:3001/agents/${agent._id}`, body, {
          headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (updated) => {
          agent.name = updated.name;
          agent.description = updated.description;
          this.editingAgentId = null;
          this.openNotifyDialog('Agente actualizado correctamente.', true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.openNotifyDialog('No se pudo actualizar el agente.', false);
        },
      });
  }

  askDelete(agent: AdminAgent): void {
    this.editingAgentId = null; // Cancelar edición si la hubiera
    this.deletingAgentId = agent._id;
  }

  cancelDelete(): void {
    this.deletingAgentId = null;
  }

  confirmDelete(agent: AdminAgent): void {
    this.http.delete(`http://localhost:3001/agents/${agent._id}`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: () => {
          this.agents = this.agents.filter((a) => a._id !== agent._id);
          this.deletingAgentId = null;
          this.openNotifyDialog('Agente eliminado.', true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al borrar:', err);
          this.openNotifyDialog('Error al eliminar agente.', false);
        },
      });
  }

  private openNotifyDialog(message: string, success: boolean) {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type: success ? 'success' : 'error' },
      panelClass: success ? 'notify-success-dialog' : 'notify-error-dialog',
      position: { top: '80px' },
    });

    setTimeout(() => {
      ref.close();
    }, 3000);
  }
}