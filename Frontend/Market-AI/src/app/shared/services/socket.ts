import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket as IOSocket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket?: IOSocket;
  private platformId = inject(PLATFORM_ID);

  private ensureConnected() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.socket) return;

    const token = localStorage.getItem('token') || '';

    this.socket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    });
  }

  onAgentTimeEnded(): Observable<{ agentId: string; name: string }> {
    this.ensureConnected();

    return new Observable((observer) => {
      if (!this.socket) {
        observer.complete();
        return;
      }

      const handler = (payload: any) => observer.next(payload);
      this.socket.on('agent-time-ended', handler);

      return () => {
        this.socket?.off('agent-time-ended', handler);
      };
    });
  }
}
