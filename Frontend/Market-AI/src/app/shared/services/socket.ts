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

  // el suuario se une al soporte
  joinSupportChat() {
    this.ensureConnected();
    this.socket?.emit('support:join');
  }

  // el admin se une al chat de un usuario
  adminJoinChat(targetUserId: string) {
    this.ensureConnected();
    this.socket?.emit('support:admin-join', targetUserId);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined; 
    }
  }

  // se envia mensaje
  sendSupportMessage(text: string, targetUserId?: string) {
    this.ensureConnected();
    this.socket?.emit('support:send-message', { text, targetUserId });
  }

  // el usuario cierra el chat
  closeSupportChat() {
    this.ensureConnected();
    this.socket?.emit('support:close');
  }


  onSupportMessage(): Observable<any> {
    this.ensureConnected();
    return new Observable(observer => {
      this.socket?.on('support:message', (msg) => observer.next(msg));
    });
  }

  // recibir lista de sesiones activas
  onActiveSessions(): Observable<any> {
    this.ensureConnected();
    return new Observable(observer => {
      this.socket?.on('support:active-sessions', (sessions) => observer.next(sessions));
      this.socket?.on('support:new-session', (session) => observer.next([session])); // Simplificado para recargar o añadir
    });
  }
  
  onSessionClosed(): Observable<string> {
    this.ensureConnected();
    return new Observable(observer => {
        this.socket?.on('support:session-closed', (id) => observer.next(id));
    });
  }

  onChatHistory(): Observable<any[]> {
    this.ensureConnected();
    return new Observable(observer => {
      this.socket?.on('support:chat-history', (history) => observer.next(history));
    });
  }


}

  
