import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { SocketService } from './shared/services/socket';
import { NotificationDialogComponent } from './pages/login/popup-login';
import { AuthService } from './shared/services/auth';

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
  private authService = inject(AuthService);
  private authSub?: Subscription;

  ngOnInit() {
    this.authSub = this.authService.isLoggedIn$.subscribe((isLogged) => {
      if (isLogged) {
        if (!this.agentTimeEndedSub) {
          console.log('Suscribiendo a agent-time-ended');
          this.agentTimeEndedSub = this.socketService
            .onAgentTimeEnded()
            .subscribe(({ name }) => {
              console.log('Mostrando popup de fin de tiempo para agente:', name);
              this.openDialog(`Tu tiempo con el agente "${name}" ha terminado`);
            });
        }
      } else {
        this.agentTimeEndedSub?.unsubscribe();
        this.agentTimeEndedSub = undefined;
      }
    });
  }

  ngOnDestroy() {
    this.agentTimeEndedSub?.unsubscribe();
    this.authSub?.unsubscribe();
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