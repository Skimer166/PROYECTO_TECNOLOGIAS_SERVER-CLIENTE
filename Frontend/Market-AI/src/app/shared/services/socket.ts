import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket as IOSocket } from 'socket.io-client';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../config';

export interface SupportMessage {
  sender: string;
  text: string;
  time?: Date | string;
  isSystem?: boolean;
}

export interface SupportSession {
  userId: string;
  userName?: string;
  messages?: SupportMessage[];
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket?: IOSocket;
  private platformId = inject(PLATFORM_ID);

  private activeSessionsSubject = new BehaviorSubject<SupportSession[]>([]);

  private messageSubject = new Subject<SupportMessage>();
  private sessionClosedSubject = new Subject<string>();
  private chatHistorySubject = new Subject<SupportMessage[]>();
  private agentTimeEndedSubject = new Subject<{ agentId: string; name: string }>();

  private ensureConnected() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.socket && this.socket.connected) return;

    const token = localStorage.getItem('token') || '';

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = undefined;
    }

    this.socket = io(environment.socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    // 1. Lista completa de sesiones (llega al conectarse el admin)
    this.socket.on('support:active-sessions', (sessions: SupportSession[]) => {
      console.log('Recibida lista inicial de sesiones:', sessions);
      this.activeSessionsSubject.next(sessions);
    });

    // 2. Nueva sesión individual (llega cuando un usuario abre chat)
    this.socket.on('support:new-session', (newSession: SupportSession) => {
      console.log('Nueva sesión recibida:', newSession);
      const currentList = this.activeSessionsSubject.value;

      const exists = currentList.find(s => s.userId === newSession.userId);
      if (!exists) {
        this.activeSessionsSubject.next([...currentList, newSession]);
      }
    });

    // 3. Sesión cerrada
    this.socket.on('support:session-closed', (userId: string) => {
      this.sessionClosedSubject.next(userId);

      const currentList = this.activeSessionsSubject.value;
      const updatedList = currentList.filter(s => s.userId !== userId);
      this.activeSessionsSubject.next(updatedList);
    });

    // 4. Mensajes de chat
    this.socket.on('support:message', (msg: SupportMessage) => {
      this.messageSubject.next(msg);
    });

    // 5. Historial de chat
    this.socket.on('support:chat-history', (history: SupportMessage[]) => {
      this.chatHistorySubject.next(history);
    });

    // 6. Agentes (Tiempo terminado)
    this.socket.on('agent-time-ended', (payload: { agentId: string; name: string }) => {
      this.agentTimeEndedSubject.next(payload);
    });
  }


  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }

  reconnect() {
    this.disconnect();
    this.ensureConnected();
  }


  // observables
  onActiveSessions(): Observable<SupportSession[]> {
    this.ensureConnected();
    return this.activeSessionsSubject.asObservable();
  }

  onSupportMessage(): Observable<SupportMessage> {
    this.ensureConnected();
    return this.messageSubject.asObservable();
  }

  onSessionClosed(): Observable<string> {
    this.ensureConnected();
    return this.sessionClosedSubject.asObservable();
  }

  onChatHistory(): Observable<SupportMessage[]> {
    this.ensureConnected();
    return this.chatHistorySubject.asObservable();
  }

  onAgentTimeEnded(): Observable<{ agentId: string; name: string }> {
    this.ensureConnected();
    return this.agentTimeEndedSubject.asObservable();
  }

  // emits

  joinSupportChat() {
    this.ensureConnected();
    this.socket?.emit('support:join');
  }

  adminJoinChat(targetUserId: string) {
    this.ensureConnected();
    this.socket?.emit('support:admin-join', targetUserId);
  }

  sendSupportMessage(text: string, targetUserId?: string) {
    this.ensureConnected();
    this.socket?.emit('support:send-message', { text, targetUserId });
  }

  closeSupportChat() {
    this.ensureConnected();
    this.socket?.emit('support:close');
  }
}
