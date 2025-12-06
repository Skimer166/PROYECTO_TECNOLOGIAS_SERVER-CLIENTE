import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectorRef } from '@angular/core'; // 1. Importar ChangeDetectorRef
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Header } from '../../layouts/header/header';
import { Footer } from '../../layouts/footer/footer';
import { RentDialogComponent } from '../rent-dialog/rent-dialog';
import { AuthService } from '../../shared/services/auth';
import { NotificationDialogComponent } from '../login/popup-login';

interface Agent {
  _id: string;
  name: string;
  description: string;
  category: string;
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
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.scss']
})
export class HomePage implements OnInit, OnDestroy {
  agents: Agent[] = [];
  filteredAgents: Agent[] = [];
  isLoading = false;
  error: string | null = null;

  searchTerm = '';
  selectedCategory: string = 'all';
  
  currentIndex = 0;
  private autoSlideInterval: any;
  itemsPerView = 3; 

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
    private cdr: ChangeDetectorRef, // detector de cambios
    private dialog: MatDialog,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.resolveAdminFromStorageOrToken();
    if (this.isBrowser) {
      this.loadAgents();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

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
    const storedRole = this.safeGet('user_role');
    if (storedRole === 'admin') {
      this.isAdmin = true;
      return;
    }
    const rawToken = this.safeGet('token');
    if (!rawToken) {
      this.isAdmin = false;
      return;
    }
    let token = rawToken.trim();
    if (token.startsWith('Bearer ')) token = token.substring(7);
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.isAdmin = payload.role === 'admin';
    } catch {
      this.isAdmin = false;
    }
  }

  private getAuthHeaders(): HttpHeaders {
    if (!this.isBrowser) return new HttpHeaders();
    let token = this.safeGet('token');
    if (!token) return new HttpHeaders();
    if (!token.startsWith('Bearer ')) token = `Bearer ${token}`;
    return new HttpHeaders({ Authorization: token });
  }

  private loadAgents(): void {
    this.isLoading = true;
    this.error = null;

    this.http.get<any>('http://localhost:3001/agents?available=true', {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (res) => {
        const agents = Array.isArray(res) ? res : res.agents;
        this.agents = agents || [];
        this.applyFilters();
        
        this.isLoading = false;
        this.startAutoSlide(); 


        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Error cargando agentes', err);
        this.error = 'No se pudieron cargar los agentes.';
        this.isLoading = false;
        
        this.cdr.detectChanges(); 
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
      const matchesSearch = !term ||
        agent.name.toLowerCase().includes(term) ||
        agent.description.toLowerCase().includes(term) ||
        agent.modelVersion.toLowerCase().includes(term);
      const matchesCategory = this.selectedCategory === 'all' || agent.category === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    this.currentIndex = 0;
  }

  //logica del carrusel
  get visibleAgents(): Agent[] {
    if (!this.filteredAgents.length) return [];
    
    if (this.filteredAgents.length <= this.itemsPerView) {
      return this.filteredAgents;
    }

    const result: Agent[] = [];
    for (let i = 0; i < this.itemsPerView; i++) {
      const index = (this.currentIndex + i) % this.filteredAgents.length;
      result.push(this.filteredAgents[index]);
    }
    return result;
  }

  get hasAgents(): boolean {
    return this.filteredAgents.length > 0;
  }

  next(): void {
    if (!this.hasAgents) return;
    this.currentIndex = (this.currentIndex + 1) % this.filteredAgents.length;
  }

  prev(): void {
    if (!this.hasAgents) return;
    this.currentIndex = (this.currentIndex - 1 + this.filteredAgents.length) % this.filteredAgents.length;
  }

  // Auto-slide
  startAutoSlide(): void {
    this.stopAutoSlide();
    if (this.isBrowser && this.filteredAgents.length > this.itemsPerView) {
      this.autoSlideInterval = setInterval(() => {
        this.next();
        // actualizamos la vista cuando el carrusel se mueve solo
        this.cdr.detectChanges(); 
      }, 5000); 
    }
  }

  stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  rentAgent(agent: Agent): void {
    if (!this.isBrowser) return;
    if (!localStorage.getItem('token')) {
      alert('Debes iniciar sesión para rentar.');
      return;
    }

    const dialogRef = this.dialog.open(RentDialogComponent, {
      width: '400px',
      data: { agent }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.processRent(agent, result.amount, result.unit);
      }
    });
  }

  private processRent(agent: Agent, amount: number, unit: string) {
    this.http.post(`http://localhost:3001/agents/${agent._id}/rent`, {
      amount, 
      unit
    }, {
      headers: this.getAuthHeaders()
        }
      )
      .subscribe({
        next: (res: any) => {
          this.openRentDialog(
            `¡Renta exitosa! Te quedan ${res.remainingCredits} créditos.`,
            true
          );
          if (res.remainingCredits !== undefined) {
            this.authService.updateCredits(res.remainingCredits);
          }
        },
        error: (err) => {
          console.error(err);
          const msg = err.error?.message || 'Error al rentar';
          this.openRentDialog(msg, false);
        },
      });
  }

  goToAgentPanel(): void {}
  goToUserPanel(): void {}
  private openRentDialog(message: string, isSuccess: boolean) {
    const ref = this.dialog.open(NotificationDialogComponent, {
      data: { message, type: isSuccess ? 'success' : 'error' },
      panelClass: isSuccess
        ? 'notify-rent-success-dialog'
        : 'notify-rent-error-dialog',
      position: { top: '80px' },
    });

    setTimeout(() => {
      ref.close();
    }, 4000);
  }
}