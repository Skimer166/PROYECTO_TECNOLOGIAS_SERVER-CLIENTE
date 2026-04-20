import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog'; 

import { CreateAgentDialogComponent } from '../create-agent-dialog/create-agent-dialog';
import { NotificationDialogComponent } from '../login/popup-login';

import { environment } from '../../shared/config';

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
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
],
  templateUrl: './admin-agents.html',
  styleUrl: './admin-agents.scss'
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
  editCategory = 'otros';
  deletingAgentId: string | null = null;

  readonly categories = [
    { key: 'marketing', label: 'Marketing' },
    { key: 'salud', label: 'Salud' },
    { key: 'educacion', label: 'Educación' },
    { key: 'asistente', label: 'Asistente' },
    { key: 'otros', label: 'Otros' }
  ];

  ngOnInit(): void {
    this.loadAgents();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) return new HttpHeaders();
    const value = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    return new HttpHeaders({ Authorization: value });
  }

  openCreateDialog() {
    const ref = this.dialog.open(CreateAgentDialogComponent, {
      width: '600px',
      disableClose: true 
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.loadAgents();
      }
    });
  }

  loadAgents(): void {
    this.loading = true;
    this.error = null;

    this.http.get<{ agents: AdminAgent[] }>(`${environment.apiUrl}/agents`, {
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
    this.deletingAgentId = null;
    this.editingAgentId = agent._id;
    this.editName = agent.name;
    this.editDescription = agent.description || '';
    this.editCategory = agent.category || 'otros';
  }

  cancelEdit(): void {
    this.editingAgentId = null;
  }

  saveEdit(agent: AdminAgent): void {
    if (!this.editingAgentId) return;

    const body = {
      name: this.editName,
      description: this.editDescription,
      category: this.editCategory,
    };

    this.http.put<AdminAgent>(`${environment.apiUrl}/agents/${agent._id}`, body, {
          headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (updated) => {
          agent.name = updated.name;
          agent.description = updated.description;
          agent.category = updated.category;
          this.editingAgentId = null;
          this.openNotifyDialog('Agente actualizado.', true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.openNotifyDialog('Error al actualizar.', false);
        },
      });
  }

  askDelete(agent: AdminAgent): void {
    this.editingAgentId = null;
    this.deletingAgentId = agent._id;
  }

  cancelDelete(): void {
    this.deletingAgentId = null;
  }

  confirmDelete(agent: AdminAgent): void {
    this.http.delete(`${environment.apiUrl}/agents/${agent._id}`, {
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
          this.openNotifyDialog('Error al eliminar.', false);
        },
      });
  }

  private openNotifyDialog(message: string, success: boolean) {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type: success ? 'success' : 'error' },
      panelClass: success ? 'notify-success-dialog' : 'notify-error-dialog',
      position: { top: '80px' },
    });
    setTimeout(() => ref.close(), 3000);
  }

  getCategoryLabel(category?: string): string {
    const found = this.categories.find((c) => c.key === category);
    return found ? found.label : 'Otros';
  }
}