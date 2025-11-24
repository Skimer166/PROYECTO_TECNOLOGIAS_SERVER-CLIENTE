import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { PLATFORM_ID } from '@angular/core';

import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';

interface Agent {
  _id: string;
  name: string;
  description: string;
  category: 'marketing' | 'salud' | 'educacion' | 'asistente' | 'otros' | string;
  language: string;
  modelVersion: string;
  imageUrl?: string;
  pricePerHour: number;
  availability: boolean;
  ratings?: {
    average: number;
    totalReviews: number;
  };
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HttpClientModule,
    Header,
    Footer,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss']
})
export class HomePage implements OnInit {
  agents: Agent[] = [];
  filteredAgents: Agent[] = [];
  isLoading = false;
  error: string | null = null;

  searchTerm = '';
  selectedCategory: string= 'all';
  currentIndex = 0;

  isAdmin = false;

  readonly categories = [
    { key: 'marketing', label: 'Marketing' },
    { key: 'salud', label: 'Salud y bienestar' },
    { key: 'educacion', label: 'Educación' },
    { key: 'asistente', label: 'Asistentes' },
    { key: 'otros', label: 'Otros' }
  ];

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.resolveAdminFromStorageOrToken();
    this.loadAgents();
  }

  // ==== AUTH STATE / ADMIN CHECK ====

  private safeGet(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return sessionStorage.getItem(key) ?? localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private resolveAdminFromStorageOrToken(): void {
    if (!this.isBrowser) {
      this.isAdmin = false;
      return;
    }

    // 1) Intentamos por user_role guardado por el login
    const storedRole = this.safeGet('user_role');
    if (storedRole === 'admin') {
      this.isAdmin = true;
      return;
    }

    // 2) Intentamos decodificando el JWT (si existe)
    const rawToken = this.safeGet('token');
    if (!rawToken) {
      this.isAdmin = false;
      return;
    }

    let token = rawToken.trim();
    if (token.startsWith('Bearer ')) {
      token = token.substring('Bearer '.length);
    }

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);
      this.isAdmin = payload.role === 'admin';
    } catch {
      this.isAdmin = false;
    }
  }

  private getAuthHeaders(): HttpHeaders {
    if (!this.isBrowser) return new HttpHeaders();

    let token = this.safeGet('token');
    if (!token) return new HttpHeaders();

    if (!token.startsWith('Bearer ')) {
      token = `Bearer ${token}`;
    }

    return new HttpHeaders({
      Authorization: token
    });
  }

  //carga los agentes

  private loadAgents(): void {
  this.isLoading = true;
  this.error = null;

  this.http
    .get<any>('http://localhost:3001/agents?available=true', {    //con el ?available=true solo traemos los agentes activos
      headers: this.getAuthHeaders()
    })
    .subscribe({
      next: (res) => {
        console.log('Respuesta /agents:', res);
        const agents = Array.isArray(res) ? res : res.agents;

        this.agents = agents || [];
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando agentes', err);
        if (err.status === 401) {
          this.error = 'Necesitas iniciar sesión para ver los agentes.';
        } else {
          this.error = 'No se pudieron cargar los agentes. Intenta más tarde.';
        }
        this.isLoading = false;
      }
    });
}

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onCategoryClick(categoryKey: string): void {
    this.selectedCategory = categoryKey;
    this.applyFilters();
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredAgents = this.agents.filter((agent) => {
      const matchesSearch =
        !term ||
        agent.name.toLowerCase().includes(term) ||
        agent.description.toLowerCase().includes(term) ||
        agent.modelVersion.toLowerCase().includes(term);

      const matchesCategory =
        this.selectedCategory === 'all' || agent.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });

    if (this.currentIndex >= this.filteredAgents.length) {
      this.currentIndex = 0;
    }
  }


  // ==== CAROUSEL LOGIC ====

  get hasAgents(): boolean {
    return this.filteredAgents.length > 0;
  }

  get currentAgent(): Agent | null {
    if (!this.hasAgents) return null;
    return this.filteredAgents[this.currentIndex];
  }

  get canGoPrev(): boolean {
    return this.currentIndex > 0;
  }

  get canGoNext(): boolean {
    return this.currentIndex < this.filteredAgents.length - 1;
  }

  prev(): void {
    if (this.canGoPrev) {
      this.currentIndex--;
    }
  }

  next(): void {
    if (this.canGoNext) {
      this.currentIndex++;
    }
  }

  // ==== ACTIONS ====

  rentAgent(agent: Agent): void {
    // aqui luego podemos llamar a /agents/:id/rent
    console.log('Rentar agente:', agent._id);
  }

  goToAgentPanel(): void {
    //poner la ruta de la vista de agentes (solo admins)
  }

  goToUserPanel(): void {
    //poner la ruta de la vista de usuarios (solo admins)
  }
}
