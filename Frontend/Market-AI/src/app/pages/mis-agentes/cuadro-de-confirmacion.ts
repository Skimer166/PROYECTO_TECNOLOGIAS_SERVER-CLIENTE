import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface CuadroDeConfirmacionData {
  message: string;
}

@Component({
  selector: 'app-cuadro-de-confirmacion',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="notify-box">
      <h2 class="notify-title">{{ data.message }}</h2>
    </div>
    <div mat-dialog-actions class="notify-actions">
      <button mat-button (click)="close(false)">Cancelar</button>
      <button mat-raised-button color="primary" (click)="close(true)">
        SÍ, dejar de usar
      </button>
    </div>
  `,
  styles: [
    `
      .notify-box {
        background: var(--notify-box-bg, #2b2b33);
        color: #ffffff;
        padding: 16px 24px;
        border-radius: 12px;
        text-align: center;
        margin: 20px 0 4px 0;
      }
      .notify-title {
        margin: 0;
      }
      .notify-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 4px;
      }
    `,
  ],
})
export class CuadroDeConfirmacionComponent {
  constructor(
    private dialogRef: MatDialogRef<CuadroDeConfirmacionComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: CuadroDeConfirmacionData
  ) {}

  close(result: boolean) {
    this.dialogRef.close(result);
  }
}
