import { Component, OnInit, OnDestroy, PLATFORM_ID, ChangeDetectorRef, ChangeDetectionStrategy, NgZone, inject } from '@angular/core'; 
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';

import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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
import { AdminAgentsComponent } from '../admin-agents/admin-agents';

import { environment } from '../../shared/config';

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
  styleUrls: ['./home-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush 
})
export class HomePage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  agents: Agent[] = [];
  filteredAgents: Agent[] = [];
  visibleAgents: Agent[] = []; 

  isLoading = false;
  error: string | null = null;

  searchTerm = '';
  selectedCategory = 'all';
  
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | undefined;

  currentIndex = 0;
  private autoSlideInterval: ReturnType<typeof setInterval> | null = null;
  itemsPerView = 3; 

  isAdmin = false;

  readonly categories = [
    { key: 'marketing', label: 'Marketing' },
    { key: 'salud', label: 'Salud y bienestar' },
    { key: 'educacion', label: 'Educación' },
    { key: 'asistente', label: 'Asistentes' },
    { key: 'otros', label: 'Otros' }
  ];

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.resolveAdminFromStorageOrToken();
    
   
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300), // Espera 300ms a que el usuario deje de escribir
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchTerm = term;
      this.applyFilters();
    });

    if (this.isBrowser) {
      this.loadAgents();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  onSearchTermChange(value: string): void {
    // En lugar de filtrar directo, enviamos el valor al Subject
    this.searchSubject.next(value);
  }

  onCategoryClick(categoryKey: string): void {
    this.selectedCategory = categoryKey;
    this.applyFilters();
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    
    // Optimizamos el filtrado para no crear arrays intermedios innecesarios
    this.filteredAgents = this.agents.filter(agent => {
      const matchesCategory = this.selectedCategory === 'all' || agent.category === this.selectedCategory;
      
      // Si no coincide la categoría...
      if (!matchesCategory) return false;

      if (!term) return true; 

      return agent.name.toLowerCase().includes(term) ||
             agent.description.toLowerCase().includes(term) ||
             agent.modelVersion.toLowerCase().includes(term);
    });
    
    this.currentIndex = 0;
    this.updateVisibleAgents(); 
  }


  updateVisibleAgents(): void {
    if (!this.filteredAgents.length) {
      this.visibleAgents = [];
      this.cdr.markForCheck();
      return;
    }
    
    if (this.filteredAgents.length <= this.itemsPerView) {
      this.visibleAgents = [...this.filteredAgents];
    } else {
      const result: Agent[] = [];
      const len = this.filteredAgents.length;
      for (let i = 0; i < this.itemsPerView; i++) {
        const index = (this.currentIndex + i) % len;
        result.push(this.filteredAgents[index]);
      }
      this.visibleAgents = result;
    }
    this.cdr.markForCheck(); 
  }

  get hasAgents(): boolean {
    return this.filteredAgents.length > 0;
  }

  next(): void {
    if (!this.hasAgents) return;
    this.currentIndex = (this.currentIndex + 1) % this.filteredAgents.length;
    this.updateVisibleAgents();
  }

  prev(): void {
    if (!this.hasAgents) return;
    this.currentIndex = (this.currentIndex - 1 + this.filteredAgents.length) % this.filteredAgents.length;
    this.updateVisibleAgents();
  }

  startAutoSlide(): void {
    this.stopAutoSlide();
    if (this.isBrowser && this.filteredAgents.length > this.itemsPerView) {
      
      this.ngZone.runOutsideAngular(() => {
        
        this.autoSlideInterval = setInterval(() => {
          this.ngZone.run(() => {
            this.next();
          });
        }, 5000);

      });
    }
  }

  stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  scrollToAgents(): void {
    if (!this.isBrowser) return;
    const el = document.getElementById('agents-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  trackByAgentId(index: number, agent: Agent): string {
    return agent._id;
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

    this.http.get<Agent[] | { agents: Agent[] }>(`${environment.apiUrl}/agents?available=true`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (res) => {
        const agents = Array.isArray(res) ? res : res.agents;
        this.agents = agents || [];
        this.applyFilters(); 
        
        this.isLoading = false;
        this.startAutoSlide(); 

        this.cdr.markForCheck(); 
      },
      error: (err) => {
        console.error('Error cargando agentes', err);
        this.error = 'No se pudieron cargar los agentes.';
        this.isLoading = false;
        this.cdr.markForCheck(); 
      }
    });
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
    this.http.post<{ remainingCredits: number }>(`${environment.apiUrl}/agents/${agent._id}/rent`, {
      amount,
      unit
    }, {
      headers: this.getAuthHeaders()
    }).subscribe({
        next: (res) => {
          this.openRentDialog(
            `¡Renta exitosa! Te quedan ${res.remainingCredits} créditos.`,
            true
          );
          if (res.remainingCredits !== undefined) {
            this.authService.updateCredits(res.remainingCredits);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
          const msg = err.error?.message || 'Error al rentar';
          this.openRentDialog(msg, false);
          this.cdr.markForCheck();
        },
      });
  }

  goToAgentPanel(): void {
    if (!this.isBrowser) return;

    this.dialog.open(AdminAgentsComponent, {
      width: '900px',
      maxHeight: '80vh',
      panelClass: 'admin-agents-dialog'
    });
  }

  goToUserPanel(): void {
    if (!this.isBrowser) return;
    this.router.navigate(['/admin/users']);
  }

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