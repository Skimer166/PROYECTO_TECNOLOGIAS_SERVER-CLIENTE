import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { SocketService } from '../../shared/services/socket';
import { AuthService } from '../../shared/services/auth';

@Component({
  selector: 'app-support-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './support-widget.html',
  styleUrl: './support-widget.scss'
})
export class SupportWidgetComponent implements OnInit {
  isOpen = false;
  isLoggedIn = false;
  messages: any[] = [];
  newMessage = '';
  userName = ''; 

  private socket = inject(SocketService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.auth.isLoggedIn$.subscribe(v => {
      this.isLoggedIn = v;
      if(v) this.getUserName();
    });

    this.socket.onSupportMessage().subscribe(msg => {
      this.messages.push(msg);
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  getUserName() {
    const token = this.auth.getToken();
    if(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.userName = payload.name;
        } catch {}
    }
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.socket.joinSupportChat();
    } else {
      this.socket.closeSupportChat();
      this.messages = []; 
    }
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.socket.sendSupportMessage(this.newMessage);
    this.newMessage = '';
  }

  scrollToBottom() {
    setTimeout(() => {
        const el = document.querySelector('.chat-body');
        if(el) el.scrollTop = el.scrollHeight;
    }, 100);
  }
}