import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SocketService } from './shared/services/socket';
import { NotificationDialogComponent } from './pages/login/popup-login';

import { Header } from './layouts/header/header';
import { Footer } from './layouts/footer/footer';
import { SupportWidgetComponent } from './pages/support-widget/support-widget';
@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, SupportWidgetComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Market-AI');

  private socketService = inject(SocketService);
  private dialog = inject(MatDialog);
  private agentTimeEndedSub?: Subscription;

  ngOnInit() {
    this.agentTimeEndedSub = this.socketService
      .onAgentTimeEnded()
      .subscribe(({ name }) => {
        this.openDialog(`Tu tiempo con el agente "${name}" ha terminado`);
      });
  }

  ngOnDestroy() {
    this.agentTimeEndedSub?.unsubscribe();
  }

  private openDialog(message: string) {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type: 'error' },
      panelClass: 'notify-time-dialog',
      position: { top: '80px' }
    });

    setTimeout(() => {
      ref.close();
    }, 4000);
  }
}