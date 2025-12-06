import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

import { NotificationDialogComponent } from '../login/popup-login';
import { EditCreditsDialogComponent } from './edit-credits-dialog';
import { ConfirmDeleteUserDialogComponent } from './confirm-delete-user-dialog';
import { AuthService } from '../../shared/services/auth';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  credits: number;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="admin-users-page">
      <div class="admin-users-card">
        <div class="admin-users-header">
          <button
            mat-icon-button
            routerLink="/home-page"
            title="Volver al inicio"
            class="back-button"
          >
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h2 class="admin-users-title">Panel de usuarios</h2>
        </div>

        <div class="admin-users-content">
          <div *ngIf="loading" class="state-message">
            <mat-icon>hourglass_empty</mat-icon>
            <span>Cargando usuarios...</span>
          </div>

          <div *ngIf="error" class="state-message state-message--error">
            <mat-icon>error_outline</mat-icon>
            <span>{{ error }}</span>
          </div>

          <div *ngIf="!loading && !error && !users.length" class="state-message">
            <mat-icon>group_off</mat-icon>
            <span>No hay usuarios registrados.</span>
          </div>

          <div *ngIf="!loading && !error && users.length" class="user-list">
            <div class="user-row user-row--header">
              <div class="user-col user-col--state">Estado</div>
              <div class="user-col user-col--role">Rol</div>
              <div class="user-col user-col--name">Nombre</div>
              <div class="user-col user-col--email">Correo</div>
              <div class="user-col user-col--credits">Créditos</div>
              <div class="user-col user-col--actions">Acciones</div>
            </div>

            <div class="user-row" *ngFor="let user of users">
              <div class="user-col user-col--state">
                <span
                  class="state-chip"
                  [class.state-chip--active]="user.role === 'admin'"
                >
                  {{ user.role === 'admin' ? 'Activo' : 'Pendiente' }}
                </span>
              </div>

              <div class="user-col user-col--role">
                <mat-form-field
                  appearance="outline"
                  class="inline-field inline-field--small"
                >
                  <mat-select
                    [value]="user.role"
                    (selectionChange)="changeRole(user, $event.value)"
                  >
                    <mat-option value="user">Usuario</mat-option>
                    <mat-option value="admin">Admin</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="user-col user-col--name">
                {{ user.name }}
              </div>

              <div class="user-col user-col--email">
                {{ user.email }}
              </div>

              <div class="user-col user-col--credits">
                <span class="credits-value">{{ user.credits }}</span>
                <button
                  mat-icon-button
                  class="credits-edit-btn"
                  (click)="openCreditsDialog(user)"
                  title="Agregar créditos"
                >
                  <mat-icon>edit</mat-icon>
                </button>
              </div>

              <div class="user-col user-col--actions">
                <button
                  mat-stroked-button
                  class="user-btn user-btn-role"
                  [disabled]="updatingRoleId === user.id"
                  (click)="resetRole(user)"
                >
                  Revertir
                </button>
                <button
                  mat-stroked-button
                  class="user-btn user-btn-delete"
                  (click)="deleteUser(user)"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-users-page {
        min-height: 100vh;
        display: flex;
        align-items: stretch;
        justify-content: center;
        padding: 8px;
        box-sizing: border-box;
      }

      .admin-users-card {
        width: 95vw;
        max-width: 1400px;
        background: #1e1b4b;
        color: #ffffff;
        border-radius: 24px;
        padding: 0 24px 12px 24px;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
        display: flex;
        flex-direction: column;
      }

      .admin-users-title {
        font-size: 1.4rem;
        font-weight: 600;
        margin: 0;
        color: #ffffff;
      }

      .admin-users-header {
        background: #6366f1;
        margin: 0 -24px 12px -24px;
        padding: 8px 24px;
        border-radius: 24px 24px 0 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .admin-users-content {
        margin-top: 8px;
        flex: 1;
        max-height: none;
        overflow: auto;
        padding-bottom: 0;
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

      .user-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;
        color: #ffffff;
      }

      .user-row {
        display: grid;
        grid-template-columns: 0.8fr 0.9fr 1.4fr 2fr 0.8fr 0.9fr;
        gap: 12px;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .user-row--header {
        font-weight: 600;
        border-bottom-width: 2px;
      }

      .user-col--actions {
        display: flex;
        justify-content: flex-end;
      }

      .user-col--credits {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .credits-value {
        min-width: 32px;
        text-align: right;
      }

      .credits-edit-btn {
        width: 32px;
        height: 32px;
        color: #fbbf24;
      }

      .inline-field {
        width: 100%;
      }

      .inline-field--small {
        max-width: 150px;
      }

      .user-btn {
        border-radius: 999px;
        padding-inline: 14px;
        font-weight: 500;
      }

      .user-btn-role {
        border-color: #a5b4fc;
        color: #e0e7ff;
      }

      .user-btn-role[disabled] {
        opacity: 0.5;
      }

      .user-btn-close {
        color: #ff80c0;
      }

      .user-btn-delete {
        border-color: #ff4d6a;
        color: #ff8a9a;
      }

      .user-col--state {
        display: flex;
        align-items: center;
      }

      .state-chip {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.8rem;
        background: rgba(148, 163, 184, 0.25);
        color: #e5e7eb;
      }

      .state-chip--active {
        background: rgba(16, 185, 129, 0.3);
        color: #bbf7d0;
      }

      /* Estilos para que el dropdown de Rol se vea claro sobre el fondo oscuro */
      .admin-users-card .mat-mdc-text-field-wrapper {
        background: rgba(0, 0, 0, 0.35);
        border-radius: 10px;
      }

      .admin-users-card .mat-mdc-select-value-text,
      .admin-users-card .mat-mdc-select-placeholder,
      .admin-users-card .mat-mdc-form-field-subscript-wrapper {
        color: #ffffff !important;
      }

      /* color del cuadrito/flechita del dropdown (usamos ::ng-deep para sobrescribir Material) */
      :host ::ng-deep .mat-mdc-select-arrow,
      :host ::ng-deep .mat-mdc-select-arrow svg {
        color: #ff80c0 !important;
        fill: #ff80c0 !important;
      }

      .admin-users-card .mat-mdc-form-field-outline,
      .admin-users-card .mat-mdc-form-field-outline-start,
      .admin-users-card .mat-mdc-form-field-outline-end {
        border-color: rgba(255, 255, 255, 0.35);
      }

      @media (max-width: 900px) {
        .user-row {
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto auto;
        }

        .user-col--email,
        .user-col--credits,
        .user-col--actions {
          grid-column: span 2;
        }

        .user-col--actions {
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class AdminUsers implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);

  users: AdminUser[] = [];
  loading = false;
  error: string | null = null;

  updatingRoleId: string | null = null;
  private originalRoles = new Map<string, AdminUser['role']>();

  ngOnInit(): void {
    this.loadUsers();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) return new HttpHeaders();

    const value = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    return new HttpHeaders({ Authorization: value });
  }

  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.http
      .get<{ users: AdminUser[] }>('http://localhost:3001/users', {
        headers: this.getAuthHeaders(),
      })
      .subscribe({
        next: (res) => {
          this.users = (res.users || []).map((u) => ({
            ...u,
            credits: u.credits ?? 0,
          }));
          this.originalRoles.clear();
          this.users.forEach((u) => this.originalRoles.set(u.id, u.role));
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar usuarios para admin:', err);
          this.error = 'No se pudieron cargar los usuarios.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  changeRole(user: AdminUser, newRole: AdminUser['role']): void {
    if (user.role === newRole) return;

    this.updatingRoleId = user.id;

    this.http
      .put<{ id: string; role: AdminUser['role'] }>(
        `http://localhost:3001/users/${user.id}/role`,
        { role: newRole },
        { headers: this.getAuthHeaders() }
      )
      .subscribe({
        next: (res) => {
          user.role = res.role;
          this.originalRoles.set(user.id, res.role);
          this.updatingRoleId = null;
          this.openNotifyDialog('Rol actualizado correctamente.', true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al actualizar rol del usuario:', err);
          const previous = this.originalRoles.get(user.id);
          if (previous) {
            user.role = previous;
          }
          this.updatingRoleId = null;
          this.openNotifyDialog('No se pudo actualizar el rol.', false);
          this.cdr.detectChanges();
        },
      });
  }

  resetRole(user: AdminUser): void {
    const original = this.originalRoles.get(user.id);
    if (!original || original === user.role) return;
    user.role = original;
  }

  deleteUser(user: AdminUser): void {
    const ref = this.dialog.open(ConfirmDeleteUserDialogComponent, {
      data: {
        message: `¿Seguro que deseas eliminar al usuario "${user.name}"?`,
      },
      panelClass: 'notify-error-dialog',
      position: { top: '80px' },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.http
        .delete<void>(`http://localhost:3001/users/${user.id}`, {
          headers: this.getAuthHeaders(),
        })
        .subscribe({
          next: () => {
            this.users = this.users.filter((u) => u.id !== user.id);
            this.openNotifyDialog('Usuario eliminado correctamente.', true);
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error eliminando usuario:', err);
            this.openNotifyDialog('No se pudo eliminar el usuario.', false);
            this.cdr.detectChanges();
          },
        });
    });
  }

  openCreditsDialog(user: AdminUser): void {
    const ref = this.dialog.open(EditCreditsDialogComponent, {
      width: '320px',
      data: { userName: user.name },
    });

    ref.afterClosed().subscribe((amount) => {
      const numeric = Number(amount);
      if (!numeric || numeric <= 0) return;
      this.addCredits(user, numeric);
    });
  }

  private addCredits(user: AdminUser, amount: number): void {
    this.http
      .put<{ id: string; credits: number }>(
        `http://localhost:3001/users/${user.id}/credits`,
        { amount },
        { headers: this.getAuthHeaders() }
      )
      .subscribe({
        next: (res) => {
          user.credits = res.credits;

          const currentUserId = this.getCurrentUserId();
          if (currentUserId && currentUserId === user.id) {
            this.authService.updateCredits(res.credits);
          }

          this.openNotifyDialog('Créditos actualizados correctamente.', true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error actualizando créditos:', err);
          this.openNotifyDialog('No se pudieron actualizar los créditos.', false);
          this.cdr.detectChanges();
        },
      });
  }

  private getCurrentUserId(): string | null {
    const token = this.authService.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.id || payload._id || null;
    } catch {
      return null;
    }
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
