import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SocketService } from '../../shared/services/socket';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './admin-support.html',
  styleUrl: './admin-support.scss'
})
export class AdminSupport implements OnInit {
  sessions: any[] = [];
  selectedSession: any = null;
  chatHistory: any[] = [];
  adminReply = '';

  private socket = inject(SocketService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.socket.onActiveSessions().subscribe((data: any) => {
      if (Array.isArray(data)) {
        this.sessions = data;
      } else {
        if (!this.sessions.find(s => s.userId === data.userId)) {
          this.sessions.push(data);
        }
      }
      this.cdr.detectChanges();
    });

    this.socket.onSessionClosed().subscribe(userId => {
        this.sessions = this.sessions.filter(s => s.userId !== userId);
        if (this.selectedSession?.userId === userId) {
            this.selectedSession = null;
            this.chatHistory = [];
        }
        this.cdr.detectChanges();
    });

    this.socket.onSupportMessage().subscribe(msg => {
        if (this.selectedSession) {
            this.chatHistory.push(msg);
            this.cdr.detectChanges();
        }
    });
  }

  selectSession(session: any) {
    this.selectedSession = session;
    this.chatHistory = session.messages || []; // si hay mensajes previos los cargamos
    this.socket.adminJoinChat(session.userId);
  }

  sendReply() {
    if(!this.adminReply || !this.selectedSession) return;
    this.socket.sendSupportMessage(this.adminReply, this.selectedSession.userId);
    this.adminReply = '';
  }
}