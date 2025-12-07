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
  status: 'active' | 'blocked';
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
          <div class="header-left">
            <button
              mat-icon-button
              routerLink="/home-page"
              title="Volver al inicio"
            >
              <mat-icon>arrow_back</mat-icon>
            </button>
            <h1 class="admin-users-title">
              Panel de Administración de Usuarios
            </h1>
          </div>
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

          <div *ngIf="!loading && !error && users.length" class="user-list-container">
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
                <button
                  mat-stroked-button
                  class="state-chip"
                  [class.state-chip--active]="user.status === 'active'"
                  [class.state-chip--blocked]="user.status === 'blocked'"
                  (click)="toggleStatus(user)"
                >
                  {{ user.status === 'blocked' ? 'Bloqueado' : 'Activo' }}
                </button>
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
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        min-height: 100vh;
        color: #ffffff;
        box-sizing: border-box;
      }

      .admin-users-card {
        width: 100%;
        display: flex;
        flex-direction: column;
      }

      .admin-users-title {
        margin: 0;
        font-size: 1.8rem;
        font-weight: 300;
        color: #ffffff;
      }

      .admin-users-header {
        display: flex;
        align-items: center;
        margin-bottom: 2rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 1rem;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .header-left button {
        color: #a5b4fc;
      }

      .admin-users-content {
        flex: 1;
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

      .user-list-container {
        background: rgba(30, 41, 59, 0.5);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        overflow: hidden;
        margin-top: 1rem;
      }

      .user-row {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        transition: background 0.2s;
      }

      .user-row:last-child {
        border-bottom: none;
      }

      .user-row:hover:not(.user-row--header) {
        background: rgba(255, 255, 255, 0.03);
      }

      .user-row--header {
        background: rgba(99, 102, 241, 0.2);
        font-weight: 700;
        color: #a5b4fc;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .user-col {
        padding: 0 0.5rem;
        overflow: hidden;
      }

      .user-col--actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
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
        padding-inline: 18px;
        font-weight: 500;
      }

      .user-btn-role {
        background-color: #5e60ce;
        border: none;
      }

      .user-btn-role:hover {
        background-color: #7a7cff;
      }

      .user-btn-role[disabled] {
        opacity: 0.5;
      }

      .user-btn-close {
        color: #ff80c0;
      }

      .user-btn-delete {
        background-color: #ff4d6a;
        border: none;
      }

      .user-btn-delete:hover {
        background-color: #ff6f88;
      }

      /* Forzar texto blanco dentro de los botones de acciones (sobrescribe Material) */
      :host ::ng-deep .user-btn-role,
      :host ::ng-deep .user-btn-role .mdc-button__label,
      :host ::ng-deep .user-btn-delete,
      :host ::ng-deep .user-btn-delete .mdc-button__label {
        color: #ffffff !important;
      }

      .user-col--state {
        display: flex;
        align-items: center;
      }

      .state-chip {
        border-radius: 999px;
        padding: 4px 16px;
        font-size: 0.85rem;
        border: none;
        background: #64ce5eff;
      }

      .state-chip--active {
        background: #65ce5eff;
      }

      .state-chip--blocked {
        background: #ff4d6a;
      }

      /* Estilos para que el dropdown de Rol se vea claro sobre el fondo oscuro */
      .admin-users-card .mat-mdc-text-field-wrapper {
        background: #3f3f9b;
        border-radius: 10px;
      }

      /* Texto del select de Rol en blanco */
      :host ::ng-deep .inline-field--small .mat-mdc-select-trigger,
      :host ::ng-deep .inline-field--small .mat-mdc-select-value-text,
      :host ::ng-deep .inline-field--small .mat-mdc-select-placeholder,
      :host ::ng-deep .inline-field--small .mat-mdc-select-min-line {
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

      /* Forzar texto blanco en botones de estado */
      :host ::ng-deep .state-chip,
      :host ::ng-deep .state-chip .mdc-button__label {
        color: #ffffff !important;
      }

      @media (max-width: 900px) {
        .admin-users-page {
          padding: 1rem;
        }

        .admin-users-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .user-row,
        .user-row.user-row--header {
          grid-template-columns: 1fr;
          gap: 1rem;
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
            status: (u as any).status ?? 'active',
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

  toggleStatus(user: AdminUser): void {
    const nextStatus: AdminUser['status'] =
      user.status === 'active' ? 'blocked' : 'active';
    this.changeStatus(user, nextStatus);
  }

  changeStatus(user: AdminUser, newStatus: AdminUser['status']): void {
    if (user.status === newStatus) return;

    this.http
      .put<{ id: string; status: AdminUser['status'] }>(
        `http://localhost:3001/users/${user.id}/status`,
        { status: newStatus },
        { headers: this.getAuthHeaders() }
      )
      .subscribe({
        next: (res) => {
          user.status = res.status;
          this.openNotifyDialog('Estado actualizado correctamente.', true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error actualizando estado del usuario:', err);
          this.openNotifyDialog('No se pudo actualizar el estado.', false);
          this.cdr.detectChanges();
        },
      });
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
