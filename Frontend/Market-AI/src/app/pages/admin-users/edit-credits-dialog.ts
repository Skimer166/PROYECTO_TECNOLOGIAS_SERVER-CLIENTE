import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface EditCreditsDialogData {
  userName: string;
}

@Component({
  selector: 'app-edit-credits-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Agregar créditos</h2>
    <mat-dialog-content>
      <p>Usuario: <strong>{{ data.userName }}</strong></p>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Cantidad a agregar</mat-label>
        <input
          matInput
          type="number"
          min="1"
          [(ngModel)]="amount"
          placeholder="Ej. 100"
        />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!amount || amount <= 0"
        (click)="confirm()"
      >
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class EditCreditsDialogComponent {
  amount = 0;

  constructor(
    private dialogRef: MatDialogRef<EditCreditsDialogComponent, number>,
    @Inject(MAT_DIALOG_DATA) public data: EditCreditsDialogData
  ) {}

  cancel(): void {
    this.dialogRef.close();
  }

  confirm(): void {
    this.dialogRef.close(this.amount);
  }
}

