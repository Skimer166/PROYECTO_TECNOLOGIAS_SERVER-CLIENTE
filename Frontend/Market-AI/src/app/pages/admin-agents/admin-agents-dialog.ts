import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { NotificationDialogComponent } from '../login/popup-login';

interface AdminAgent {
  _id: string;
  name: string;
  description: string;
  category?: string;
  pricePerHour?: number;
  availability?: boolean;
}

@Component({
  selector: 'app-admin-agents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="admin-agents-header" mat-dialog-title>
      <h2 class="admin-agents-title">Panel de agentes</h2>
    </div>

    <mat-dialog-content class="admin-agents-content">
      <div *ngIf="loading" class="state-message">
        <mat-icon>hourglass_empty</mat-icon>
        <span>Cargando agentes...</span>
      </div>

      <div *ngIf="error" class="state-message state-message--error">
        <mat-icon>error_outline</mat-icon>
        <span>{{ error }}</span>
      </div>

      <div *ngIf="!loading && !error && !agents.length" class="state-message">
        <mat-icon>search_off</mat-icon>
        <span>No hay agentes registrados.</span>
      </div>

      <div *ngIf="!loading && !error && agents.length" class="agent-list">
        <div class="agent-row agent-row--header">
          <div class="agent-col agent-col--name">Nombre</div>
          <div class="agent-col agent-col--description">Descripción</div>
          <div class="agent-col agent-col--actions">Acciones</div>
        </div>

        <div class="agent-row" *ngFor="let agent of agents">
          <div class="agent-col agent-col--name">
            <span *ngIf="editingAgentId !== agent._id">{{ agent.name }}</span>
            <mat-form-field
              *ngIf="editingAgentId === agent._id"
              appearance="outline"
              class="inline-field"
            >
              <input
                matInput
                [(ngModel)]="editName"
                placeholder="Nombre del agente"
              />
            </mat-form-field>
          </div>

          <div class="agent-col agent-col--description">
            <span *ngIf="editingAgentId !== agent._id">
              {{ agent.description }}
            </span>
            <mat-form-field
              *ngIf="editingAgentId === agent._id"
              appearance="outline"
              class="inline-field"
            >
              <textarea
                matInput
                rows="2"
                [(ngModel)]="editDescription"
                placeholder="Descripción"
              ></textarea>
            </mat-form-field>
          </div>

          <div class="agent-col agent-col--actions">
            <!-- Acciones por defecto -->
            <ng-container
              *ngIf="
                editingAgentId !== agent._id &&
                deletingAgentId !== agent._id
              "
            >
              <button
                mat-flat-button
                class="agent-btn agent-btn-edit"
                (click)="startEdit(agent)"
              >
                Editar
              </button>
              <button
                mat-flat-button
                class="agent-btn agent-btn-delete"
                (click)="askDelete(agent)"
              >
                Borrar
              </button>
            </ng-container>

            <!-- Acciones cuando se está editando -->
            <ng-container *ngIf="editingAgentId === agent._id">
              <button mat-button (click)="cancelEdit()">Cancelar</button>
              <button
                mat-flat-button
                color="primary"
                (click)="saveEdit(agent)"
              >
                Guardar
              </button>
            </ng-container>

            <!-- Confirmación de borrado -->
            <ng-container *ngIf="deletingAgentId === agent._id">
              <span class="confirm-text">¿Borrar?</span>
              <button mat-button (click)="cancelDelete()">Cancelar</button>
              <button
                mat-flat-button
                color="warn"
                (click)="confirmDelete(agent)"
              >
                Confirmar
              </button>
            </ng-container>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button class="agent-btn agent-btn-close" (click)="close()">
        Cerrar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .admin-agents-title {
        font-size: 1.4rem;
        font-weight: 600;
        margin: 0;
        color: #ffffff;
      }

      .admin-agents-header {
        background: #6366f1;
        margin: -20px -28px 12px -28px;
        padding: 8px 24px;
        border-radius: 20px 20px 0 0;
      }

      .admin-agents-content {
        margin-top: 8px;
        max-height: 60vh;
        overflow: auto;
      }

      .state-message {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 0;
        justify-content: center;
        color: #ffffff;
      }

      .state-message--error {
        color: #ffcdd2;
      }

      .agent-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
        color: #ffffff;
      }

      .agent-row {
        display: grid;
        grid-template-columns: 1.1fr 2fr 0.9fr;
        gap: 12px;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .agent-row--header {
        font-weight: 600;
        border-bottom-width: 2px;
      }

      .agent-col--actions {
        display: flex;
        gap: 6px;
        justify-content: flex-end;
        align-items: center;
      }

      .inline-field {
        width: 100%;
      }

      .confirm-text {
        margin-right: 4px;
        font-size: 0.9rem;
        opacity: 0.9;
      }

      .agent-btn {
        border-radius: 999px;
        padding-inline: 18px;
        font-weight: 500;
      }

      .agent-btn-edit {
        background-color: #5e60ce;
        color: #ffffff;
      }

      .agent-btn-edit:hover {
        background-color: #7a7cff;
      }

      .agent-btn-delete {
        background-color: #ff4d6a;
        color: #ffffff;
      }

      .agent-btn-delete:hover {
        background-color: #ff6f88;
      }

      .agent-btn-close {
        color: #ff80c0;
      }

      @media (max-width: 768px) {
        .agent-row {
          grid-template-columns: 1fr;
          align-items: flex-start;
        }

        .agent-col--actions {
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class AdminAgentsDialogComponent implements OnInit {
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<AdminAgentsDialogComponent>);
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

    this.http
      .get<{ agents: AdminAgent[] }>('http://localhost:3001/agents', {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (res) => {
          this.agents = res.agents || [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar agentes para admin:', err);
          this.error = 'No se pudieron cargar los agentes.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  startEdit(agent: AdminAgent): void {
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

    this.http
      .put<AdminAgent>(
        `http://localhost:3001/agents/${agent._id}`,
        body,
        {
          headers: this.getAuthHeaders(),
        }
      )
      .subscribe({
        next: (updated) => {
          agent.name = updated.name;
          agent.description = updated.description;
          this.editingAgentId = null;
          this.openNotifyDialog('Agente actualizado correctamente.', true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al actualizar agente:', err);
          this.openNotifyDialog('No se pudo actualizar el agente.', false);
          this.cdr.detectChanges();
        },
      });
  }

  askDelete(agent: AdminAgent): void {
    this.deletingAgentId = agent._id;
  }

  cancelDelete(): void {
    this.deletingAgentId = null;
  }

  confirmDelete(agent: AdminAgent): void {
    this.http
      .delete(`http://localhost:3001/agents/${agent._id}`, {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: () => {
          this.agents = this.agents.filter((a) => a._id !== agent._id);
          this.deletingAgentId = null;
          this.openNotifyDialog('Agente borrado correctamente.', true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al borrar agente:', err);
          this.openNotifyDialog('No se pudo borrar el agente.', false);
          this.cdr.detectChanges();
        },
      });
  }

  close(): void {
    this.dialogRef.close();
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
