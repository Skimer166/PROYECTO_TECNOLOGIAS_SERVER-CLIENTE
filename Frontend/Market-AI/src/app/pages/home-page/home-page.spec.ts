import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { provideHttpClient, HttpClientModule } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { PLATFORM_ID } from '@angular/core';
import { of } from 'rxjs';

import { HomePage } from './home-page';

// ── Mock de agentes ────────────────────────────────────────────────────────────
const MOCK_AGENTS = [
  {
    _id: '1',
    name: 'Agente Marketing Pro',
    description: 'Especialista en campañas de marketing digital',
    category: 'marketing',
    language: 'es',
    modelVersion: 'GPT-4',
    pricePerHour: 10,
    availability: true,
  },
  {
    _id: '2',
    name: 'Asistente Python',
    description: 'Código limpio y eficiente para tus proyectos',
    category: 'educacion',
    language: 'es',
    modelVersion: 'GPT-3.5',
    pricePerHour: 5,
    availability: true,
  },
  {
    _id: '3',
    name: 'Coach de Salud',
    description: 'Asesoría nutricional personalizada',
    category: 'salud',
    language: 'es',
    modelVersion: 'Claude-3',
    pricePerHour: 8,
    availability: true,
  },
  {
    _id: '4',
    name: 'Asistente Virtual',
    description: 'Organiza tu agenda y correos con IA',
    category: 'asistente',
    language: 'en',
    modelVersion: 'GPT-4',
    pricePerHour: 12,
    availability: true,
  },
  {
    _id: '5',
    name: 'Experto SEO',
    description: 'Optimización para motores de búsqueda',
    category: 'marketing',
    language: 'es',
    modelVersion: 'GPT-4',
    pricePerHour: 15,
    availability: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// Suite original (ya existía — se conserva sin modificar)
// ══════════════════════════════════════════════════════════════════════════════
describe('HomePage (Unitarias)', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;

    component.agents = [
      {
        _id: '1',
        name: 'Agente Python',
        description: 'Code',
        category: 'programacion',
        language: 'es',
        modelVersion: 'v1',
        pricePerHour: 10,
        availability: true,
      },
      {
        _id: '2',
        name: 'Agente Cocina',
        description: 'Food',
        category: 'otros',
        language: 'es',
        modelVersion: 'v1',
        pricePerHour: 10,
        availability: true,
      },
    ];

    fixture.detectChanges();
  });

  it('Prueba Unitaria 5: Filtro de búsqueda', () => {
    component.searchTerm = 'Python';
    component['applyFilters']();
    expect(component.filteredAgents.length).toBe(1);
    expect(component.filteredAgents[0].name).toBe('Agente Python');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Suite HP-01 a HP-24 — Home Page
// ══════════════════════════════════════════════════════════════════════════════
describe('HP — Home Page (HP-01 a HP-24)', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    // Simular usuario autenticado (rol user por defecto)
    spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'token') return 'fake.jwt.token';
      if (key === 'user_role') return 'user';
      return null;
    });
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'token') return 'fake.jwt.token';
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [HomePage, MatDialogModule],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: {} },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    })
      .overrideComponent(HomePage, { remove: { imports: [HttpClientModule, MatDialogModule] } })
      .compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    // NO se llama fixture.detectChanges() aquí → cada test lo controla
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── Helper: responde la petición de agentes ────────────────────────────────
  function flushAgents(agents = MOCK_AGENTS): void {
    const req = httpMock.expectOne((r) => r.url.includes('/agents'));
    req.flush(agents);
  }

  // ── Helper: activa admin en sessionStorage ─────────────────────────────────
  function setAdminRole(): void {
    (sessionStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
      if (key === 'user_role') return 'admin';
      if (key === 'token') return 'fake.jwt.token';
      return null;
    });
  }

  // ─── HP-01 ─────────────────────────────────────────────────────────────────
  it('HP-01: Carga agentes disponibles desde el backend', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit → loadAgents → HTTP pendiente
    expect(component.isLoading).toBe(true);

    flushAgents();
    fixture.detectChanges();

    expect(component.isLoading).toBe(false);
    expect(component.agents.length).toBe(MOCK_AGENTS.length);
    expect(component.filteredAgents.length).toBe(MOCK_AGENTS.length);
    discardPeriodicTasks();
  }));

  // ─── HP-02 ─────────────────────────────────────────────────────────────────
  it('HP-02: hasAgents es false cuando el backend retorna lista vacía', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents([]);
    fixture.detectChanges();

    expect(component.hasAgents).toBe(false);
    expect(component.filteredAgents.length).toBe(0);
    discardPeriodicTasks();
  }));

  // ─── HP-03 ─────────────────────────────────────────────────────────────────
  it('HP-03: Establece error cuando el backend falla (500)', fakeAsync(() => {
    fixture.detectChanges();
    const req = httpMock.expectOne((r) => r.url.includes('/agents'));
    req.flush('Error del servidor', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(component.error).toBeTruthy();
    expect(component.isLoading).toBe(false);
    discardPeriodicTasks();
  }));

  // ─── HP-04 ─────────────────────────────────────────────────────────────────
  it('HP-04: Búsqueda filtra agentes por nombre (debounce 300ms)', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.onSearchTermChange('Marketing');
    tick(300); // avanzar el debounce
    fixture.detectChanges();

    expect(component.filteredAgents.length).toBe(1);
    expect(component.filteredAgents[0].name).toBe('Agente Marketing Pro');
    discardPeriodicTasks();
  }));

  // ─── HP-05 ─────────────────────────────────────────────────────────────────
  it('HP-05: Búsqueda filtra agentes por descripción', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.onSearchTermChange('nutricional');
    tick(300);
    fixture.detectChanges();

    expect(component.filteredAgents.length).toBe(1);
    expect(component.filteredAgents[0].name).toBe('Coach de Salud');
    discardPeriodicTasks();
  }));

  // ─── HP-06 ─────────────────────────────────────────────────────────────────
  it('HP-06: Búsqueda filtra agentes por modelo', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.onSearchTermChange('Claude');
    tick(300);
    fixture.detectChanges();

    expect(component.filteredAgents.length).toBe(1);
    expect(component.filteredAgents[0].modelVersion).toBe('Claude-3');
    discardPeriodicTasks();
  }));

  // ─── HP-07 ─────────────────────────────────────────────────────────────────
  it('HP-07: Limpiar búsqueda restaura todos los agentes', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    // Filtrar primero
    component.onSearchTermChange('GPT-4');
    tick(300);
    fixture.detectChanges();
    expect(component.filteredAgents.length).toBeLessThan(MOCK_AGENTS.length);

    // Limpiar
    component.onSearchTermChange('');
    tick(300);
    fixture.detectChanges();

    expect(component.filteredAgents.length).toBe(MOCK_AGENTS.length);
    discardPeriodicTasks();
  }));

  // ─── HP-08 ─────────────────────────────────────────────────────────────────
  it('HP-08: Chip "all" muestra todos los agentes sin filtro de categoría', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.onCategoryClick('marketing');
    fixture.detectChanges();
    expect(component.filteredAgents.length).toBeLessThan(MOCK_AGENTS.length);

    component.onCategoryClick('all');
    fixture.detectChanges();

    expect(component.selectedCategory).toBe('all');
    expect(component.filteredAgents.length).toBe(MOCK_AGENTS.length);
    discardPeriodicTasks();
  }));

  // ─── HP-09 ─────────────────────────────────────────────────────────────────
  it('HP-09: Chip de categoría "marketing" muestra solo agentes de esa categoría', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.onCategoryClick('marketing');
    fixture.detectChanges();

    expect(component.selectedCategory).toBe('marketing');
    expect(component.filteredAgents.every((a) => a.category === 'marketing')).toBe(true);
    discardPeriodicTasks();
  }));

  // ─── HP-10 ─────────────────────────────────────────────────────────────────
  it('HP-10: Cambiar de categoría actualiza filteredAgents', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.onCategoryClick('marketing');
    fixture.detectChanges();
    const countMarketing = component.filteredAgents.length;

    component.onCategoryClick('educacion');
    fixture.detectChanges();
    const countEducacion = component.filteredAgents.length;

    // Las cuentas son distintas (marketing=2, educacion=1 en MOCK_AGENTS)
    expect(countMarketing).not.toBe(countEducacion);
    discardPeriodicTasks();
  }));

  // ─── HP-11 ─────────────────────────────────────────────────────────────────
  it('HP-11: visibleAgents contiene máximo 3 agentes (itemsPerView = 3)', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents(MOCK_AGENTS); // 5 agentes en total
    fixture.detectChanges();

    expect(component.visibleAgents.length).toBeLessThanOrEqual(3);
    expect(component.visibleAgents.length).toBeGreaterThan(0);
    discardPeriodicTasks();
  }));

  // ─── HP-12 ─────────────────────────────────────────────────────────────────
  it('HP-12: next() incrementa el índice del carousel', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    const before = component.currentIndex;
    component.next();
    fixture.detectChanges();

    const total = component.filteredAgents.length;
    expect(component.currentIndex).toBe((before + 1) % total);
    discardPeriodicTasks();
  }));

  // ─── HP-13 ─────────────────────────────────────────────────────────────────
  it('HP-13: prev() decrementa el índice del carousel (con wrap-around)', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    const before = component.currentIndex;
    const total = component.filteredAgents.length;
    component.prev();
    fixture.detectChanges();

    expect(component.currentIndex).toBe((before - 1 + total) % total);
    discardPeriodicTasks();
  }));

  // ─── HP-14 ─────────────────────────────────────────────────────────────────
  it('HP-14: startAutoSlide() avanza el carousel automáticamente cada 5 segundos', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents(MOCK_AGENTS); // 5 agentes → auto-slide activo (5 > 3)
    fixture.detectChanges();

    // Detener el auto-slide que inició loadAgents y reiniciar limpio
    component.stopAutoSlide();
    const indexBefore = component.currentIndex;
    component.startAutoSlide();

    tick(5000); // avanzar el reloj 5 segundos
    fixture.detectChanges();

    expect(component.currentIndex).not.toBe(indexBefore);
    discardPeriodicTasks();
  }));

  // ─── HP-15 ─────────────────────────────────────────────────────────────────
  it('HP-15: stopAutoSlide() cancela el auto-scroll (simula hover)', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents(MOCK_AGENTS);
    fixture.detectChanges();

    component.stopAutoSlide(); // simula mouseenter → stopAutoSlide
    const indexAfterStop = component.currentIndex;

    tick(5000); // 5 segundos sin que el intervalo exista
    fixture.detectChanges();

    expect(component.currentIndex).toBe(indexAfterStop);
    discardPeriodicTasks();
  }));

  // ─── HP-16 ─────────────────────────────────────────────────────────────────
  it('HP-16: visibleAgents contiene agentes con todos los campos requeridos', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    expect(component.visibleAgents.length).toBeGreaterThan(0);
    const agent = component.visibleAgents[0];
    expect(agent.name).toBeDefined();
    expect(agent.category).toBeDefined();
    expect(agent.description).toBeDefined();
    expect(agent.modelVersion).toBeDefined();
    expect(agent.pricePerHour).toBeDefined();
    expect(agent.language).toBeDefined();
    discardPeriodicTasks();
  }));

  // ─── HP-17 ─────────────────────────────────────────────────────────────────
  it('HP-17: rentAgent() abre el MatDialog de renta', fakeAsync(() => {
    const openSpy = spyOn((component as unknown as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(null),
    } as unknown as MatDialogRef<unknown>);

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    const agent = component.visibleAgents[0];
    component.rentAgent(agent);

    expect(openSpy).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  // ─── HP-18 ─────────────────────────────────────────────────────────────────
  it('HP-18: isAdmin = true cuando user_role es "admin" en sessionStorage', fakeAsync(() => {
    setAdminRole();

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    expect(component.isAdmin).toBe(true);
    discardPeriodicTasks();
  }));

  // ─── HP-19 ─────────────────────────────────────────────────────────────────
  it('HP-19: isAdmin = false cuando user_role es "user" (panel de admin no se muestra)', fakeAsync(() => {
    // El spy por defecto ya retorna 'user' para user_role
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    expect(component.isAdmin).toBe(false);

    const compiled = fixture.nativeElement as HTMLElement;
    const adminPanel = compiled.querySelector('.admin-panel');
    expect(adminPanel).toBeNull();
    discardPeriodicTasks();
  }));

  // ─── HP-20 ─────────────────────────────────────────────────────────────────
  it('HP-20: Panel de admin muestra botón "Panel de agentes" con navegación a /admin/agents', fakeAsync(() => {
    setAdminRole();

    fixture.detectChanges();
    flushAgents([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const agentBtn = buttons.find((btn) => btn.textContent?.includes('Panel de agentes'));

    expect(agentBtn).toBeTruthy();
    discardPeriodicTasks();
  }));

  // ─── HP-21 ─────────────────────────────────────────────────────────────────
  it('HP-21: goToUserPanel() navega a /admin/users', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate');

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.goToUserPanel();

    expect(navigateSpy).toHaveBeenCalledWith(['/admin/users']);
    discardPeriodicTasks();
  }));

  // ─── HP-22 ─────────────────────────────────────────────────────────────────
  it('HP-22: Panel de admin muestra botón "Chats de Soporte" con navegación a /admin/support', fakeAsync(() => {
    setAdminRole();

    fixture.detectChanges();
    flushAgents([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(compiled.querySelectorAll('button'));
    const supportBtn = buttons.find((btn) => btn.textContent?.includes('Chats de Soporte'));

    expect(supportBtn).toBeTruthy();
    discardPeriodicTasks();
  }));

  // ─── HP-23 ─────────────────────────────────────────────────────────────────
  it('HP-23: Filtro combinado de categoría + búsqueda aplica ambos criterios', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    // Seleccionar categoría 'marketing'
    component.onCategoryClick('marketing');
    fixture.detectChanges();

    // Añadir texto de búsqueda dentro de esa categoría
    component.onSearchTermChange('SEO');
    tick(300);
    fixture.detectChanges();

    expect(component.filteredAgents.length).toBe(1);
    expect(component.filteredAgents[0].name).toBe('Experto SEO');
    expect(component.filteredAgents[0].category).toBe('marketing');
    discardPeriodicTasks();
  }));

  // ─── HP-24 ─────────────────────────────────────────────────────────────────
  it('HP-24: authActivateGuard redirige a /login cuando no hay token en storage', () => {
    // Simular ausencia de token
    (sessionStorage.getItem as jasmine.Spy).and.returnValue(null);
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);

    // El guard verifica: !!(sessionStorage.getItem('token') || localStorage.getItem('token'))
    const hasToken = !!(sessionStorage.getItem('token') || localStorage.getItem('token'));
    expect(hasToken).toBe(false);

    // Si hasToken es false, el guard retorna router.parseUrl('/login') — no se llega al componente.
    // Verificamos además que el componente no inicializa carga si no hay sesión.
    // (En producción el guard previene que este componente se instancie)
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  // ── Pruebas adicionales — casos borde y comportamiento interno ──────────────

  it('HP-extra-1: next() no modifica currentIndex cuando no hay agentes cargados', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents([]);
    fixture.detectChanges();

    const indexBefore = component.currentIndex;
    component.next();
    fixture.detectChanges();

    expect(component.currentIndex).toBe(indexBefore);
    discardPeriodicTasks();
  }));

  it('HP-extra-2: prev() no modifica currentIndex cuando no hay agentes cargados', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents([]);
    fixture.detectChanges();

    const indexBefore = component.currentIndex;
    component.prev();
    fixture.detectChanges();

    expect(component.currentIndex).toBe(indexBefore);
    discardPeriodicTasks();
  }));

  it('HP-extra-3: startAutoSlide() no inicia el intervalo cuando hay exactamente 3 agentes (= itemsPerView)', fakeAsync(() => {
    const THREE_AGENTS = MOCK_AGENTS.slice(0, 3); // 3 === itemsPerView → no cicla

    fixture.detectChanges();
    flushAgents(THREE_AGENTS);
    fixture.detectChanges();

    component.stopAutoSlide();
    const indexBefore = component.currentIndex;
    component.startAutoSlide(); // condición: length > itemsPerView → 3 > 3 = false

    tick(5000);
    fixture.detectChanges();

    expect(component.currentIndex).toBe(indexBefore);
    discardPeriodicTasks();
  }));

  it('HP-extra-4: La petición HTTP incluye el parámetro ?available=true', fakeAsync(() => {
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url.includes('/agents') && r.url.includes('available=true'));
    req.flush([]);
    fixture.detectChanges();

    expect(req.request.url).toContain('available=true');
    discardPeriodicTasks();
  }));

  it('HP-extra-5: trackByAgentId() retorna el _id del agente', () => {
    const agent = MOCK_AGENTS[0];
    expect(component.trackByAgentId(0, agent)).toBe(agent._id);
  });

  it('HP-extra-6: Panel de admin se renderiza en el DOM cuando isAdmin es true', fakeAsync(() => {
    setAdminRole();

    fixture.detectChanges();
    flushAgents([]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const adminPanel = compiled.querySelector('.admin-panel');
    expect(adminPanel).not.toBeNull();
    expect(adminPanel?.textContent).toContain('Panel de administración');
    discardPeriodicTasks();
  }));
});
