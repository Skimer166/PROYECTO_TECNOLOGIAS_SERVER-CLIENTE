import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface NotificationDialogData {
  message: string;
  type?: 'success' | 'error';
}

@Component({
  selector: 'app-notification-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <div class="notify-box">
      <h2 class="notify-title">{{ data.message }}</h2>
    </div>
    <div mat-dialog-actions class="notify-actions">
      <button mat-raised-button color="primary" (click)="close()">Cerrar</button>
    </div>
  `,
  styles: [`
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
      justify-content: center;
      margin-top: 4px;
    }
  `]
})
export class NotificationDialogComponent {
  private dialogRef = inject<MatDialogRef<NotificationDialogComponent>>(MatDialogRef);
  data = inject<NotificationDialogData>(MAT_DIALOG_DATA);


  close() {
    this.dialogRef.close();
  }
}

