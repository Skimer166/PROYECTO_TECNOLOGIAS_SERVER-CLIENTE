import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rent-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
],
  template: `
    <h2 mat-dialog-title>Rentar {{ data.agent.name }}</h2>
    <mat-dialog-content>
      <p>Precio base: <strong>\${{ data.agent.pricePerHour }} / hora</strong></p>
      
      <div class="rent-controls">
        <mat-form-field appearance="outline">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" min="1" [(ngModel)]="amount">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Unidad</mat-label>
          <mat-select [(ngModel)]="unit">
            <mat-option value="hours">Horas</mat-option>
            <mat-option value="days">Días</mat-option>
            <mat-option value="months">Meses</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="total-cost">
        <mat-icon>payments</mat-icon>
        <span>Total a pagar: <strong>{{ calculateTotal() }} créditos</strong></span>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="{ amount, unit, total: calculateTotal() }">
        Confirmar Renta
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .rent-controls { display: flex; gap: 1rem; margin-top: 1rem; }
    .total-cost { 
      display: flex; align-items: center; gap: 0.5rem; 
      background: rgba(99, 102, 241, 0.1); color: #6366f1;
      padding: 1rem; border-radius: 8px; margin-top: 0.5rem;
    }
  `]
})
export class RentDialogComponent {
  dialogRef = inject<MatDialogRef<RentDialogComponent>>(MatDialogRef);
  data = inject<{
    agent: { name: string; pricePerHour: number };
}>(MAT_DIALOG_DATA);

  amount = 1;
  unit = 'hours';

  calculateTotal(): number {
    let multiplier = 1;
    if (this.unit === 'days') multiplier = 24;
    if (this.unit === 'months') multiplier = 720;
    return this.data.agent.pricePerHour * this.amount * multiplier;
  }
}