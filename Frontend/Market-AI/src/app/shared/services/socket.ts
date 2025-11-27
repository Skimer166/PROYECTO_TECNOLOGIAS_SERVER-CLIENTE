import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket as IOSocket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket?: IOSocket;
  private platformId = inject(PLATFORM_ID);

  private agentTimeEndedSubject = new Subject<{ agentId: string; name: string }>();

  private ensureConnected() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.socket) return;

    const token = localStorage.getItem('token') || '';
    if (!token) {
      //Si no hay token (usuario no logueado) no abrimos conexion
      return;
    }

    this.socket = io('http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    });

    this.registerAgentTimeEndedListener();
  }

  private registerAgentTimeEndedListener() {
    if (!this.socket) return;

    //Evitar listeners duplicados si se reconecta
    this.socket.off('agent-time-ended');

    this.socket.on('agent-time-ended', (payload: any) => {
      console.log('Evento agent-time-ended recibido en cliente:', payload);
      this.agentTimeEndedSubject.next(payload);
    });
  }

  onAgentTimeEnded(): Observable<{ agentId: string; name: string }> {
    this.ensureConnected();
    this.registerAgentTimeEndedListener();

    return this.agentTimeEndedSubject.asObservable();
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

  reconnect() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Forzamos cierre de la conexión actual (si existe)
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }

    // Y tratamos de abrir una nueva con el token actual
    this.ensureConnected();
  }
}
