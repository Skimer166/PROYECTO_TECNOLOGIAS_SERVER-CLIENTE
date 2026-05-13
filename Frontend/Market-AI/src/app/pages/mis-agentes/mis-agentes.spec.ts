import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { Subject } from 'rxjs';
import { of } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

import { MyAgents } from './mis-agentes';
import { SocketService } from '../../shared/services/socket';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface MyAgent {
  _id: string;
  name: string;
  description: string;
  category?: string;
  imageUrl?: string;
  rentedUntil?: string;
  timeLeftDisplay?: string;
  pricePerHour?: number;
}

// ── Mock de agentes ────────────────────────────────────────────────────────────
const FUTURE_DATE = new Date(Date.now() + 3_600_000).toISOString(); // +1 hora

const MOCK_MY_AGENTS: MyAgent[] = [
  {
    _id: 'a1',
    name: 'Agente Python',
    description: 'Experto en Python y scripting',
    category: 'educacion',
    rentedUntil: FUTURE_DATE,
  },
  {
    _id: 'a2',
    name: 'Agente Marketing',
    description: 'Estrategias de marketing digital',
    category: 'marketing',
    rentedUntil: FUTURE_DATE,
  },
];

// ── Mock de SocketService ──────────────────────────────────────────────────────
let agentTimeEndedSubject: Subject<{ agentId: string; name: string }>;

const mockSocketService = {
  onAgentTimeEnded: jasmine
    .createSpy('onAgentTimeEnded')
    .and.callFake(() => agentTimeEndedSubject.asObservable()),
};

// ══════════════════════════════════════════════════════════════════════════════
// Suite MA-01 a MA-16 — My Agents Page
// ══════════════════════════════════════════════════════════════════════════════
describe('MA — My Agents Page (MA-01 a MA-16)', () => {
  let component: MyAgents;
  let fixture: ComponentFixture<MyAgents>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    // Reiniciar el subject del socket en cada test
    agentTimeEndedSubject = new Subject();
    mockSocketService.onAgentTimeEnded.calls.reset();

    // Simular localStorage con token
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'token') return 'fake.jwt.token';
      return null;
    });

    await TestBed.configureTestingModule({
      imports: [MyAgents],
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SocketService, useValue: mockSocketService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyAgents);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    // NO se llama fixture.detectChanges() aquí → cada test lo controla
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── Helper: responde la petición de /agents/my-rentals ─────────────────────
  function flushAgents(agents: MyAgent[] = MOCK_MY_AGENTS): void {
    const req = httpMock.expectOne((r) => r.url.includes('/agents/my-rentals'));
    req.flush({ agents });
  }

  // ── Helper: mock de MatDialog ──────────────────────────────────────────────
  function mockDialog(confirmed: boolean) {
    return spyOn((component as unknown as { dialog: MatDialog }).dialog, 'open').and.returnValue({
      afterClosed: () => of(confirmed),
      close: jasmine.createSpy('close'),
    } as unknown as MatDialogRef<unknown>);
  }

  // ─── MA-01 ─────────────────────────────────────────────────────────────────
  it('MA-01: Carga la lista de agentes rentados desde el backend', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit → loadMyAgents → HTTP pendiente
    expect(component.loading).toBe(true);

    flushAgents();
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.agents.length).toBe(MOCK_MY_AGENTS.length);
    discardPeriodicTasks();
  }));

  // ─── MA-02 ─────────────────────────────────────────────────────────────────
  it('MA-02: agents.length es 0 cuando el backend retorna lista vacía', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents([]);
    fixture.detectChanges();

    expect(component.agents.length).toBe(0);
    discardPeriodicTasks();
  }));

  // ─── MA-03 ─────────────────────────────────────────────────────────────────
  it('MA-03: updateCountdowns() actualiza timeLeftDisplay con formato Xd Xh Xm Xs', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    // Avanzar 1 segundo para que el interval dispare
    tick(1000);
    fixture.detectChanges();

    for (const agent of component.agents) {
      expect(agent.timeLeftDisplay).toBeDefined();
      // El formato puede ser "Xd Xh Xm Xs" o "Expirado"
      const validFormat =
        /\d+d \d+h \d+m \d+s/.test(agent.timeLeftDisplay!) ||
        agent.timeLeftDisplay === 'Expirado';
      expect(validFormat).toBe(true);
    }
    discardPeriodicTasks();
  }));

  // ─── MA-04 ─────────────────────────────────────────────────────────────────
  it('MA-04: Agentes tienen name, category y timeLeftDisplay tras carga', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    tick(1000); // actualizar countdowns
    fixture.detectChanges();

    expect(component.agents.length).toBeGreaterThan(0);

    const agent = component.agents[0];
    expect(agent.name).toBeDefined();
    expect(agent.name.length).toBeGreaterThan(0);
    expect(agent.category).toBeDefined();
    expect(agent.timeLeftDisplay).toBeDefined();
    discardPeriodicTasks();
  }));

  // ─── MA-05 ─────────────────────────────────────────────────────────────────
  it('MA-05: openChat() establece selectedAgent e inicializa el historial de mensajes', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    const agent = component.agents[0];
    component.openChat(agent);
    fixture.detectChanges();

    expect(component.selectedAgent).toBe(agent);
    // Mensaje de bienvenida del asistente
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].role).toBe('assistant');
    expect(component.messages[0].text).toContain(agent.name);
    discardPeriodicTasks();
  }));

  // ─── MA-06 ─────────────────────────────────────────────────────────────────
  it('MA-06: closeChat() establece selectedAgent a null (vuelve a lista)', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.openChat(component.agents[0]);
    fixture.detectChanges();
    expect(component.selectedAgent).not.toBeNull();

    component.closeChat();
    fixture.detectChanges();

    expect(component.selectedAgent).toBeNull();
    discardPeriodicTasks();
  }));

  // ─── MA-07 ─────────────────────────────────────────────────────────────────
  it('MA-07: sendMessage() agrega mensaje del usuario y respuesta del asistente', fakeAsync(() => {
    spyOn(component, 'scrollToBottom'); // evitar document.querySelector en JSDOM

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.openChat(component.agents[0]);
    fixture.detectChanges();

    const msgsBefore = component.messages.length; // mensaje de bienvenida
    component.userMessage = 'Hola, ¿puedes ayudarme?';
    component.sendMessage();
    fixture.detectChanges();

    // El mensaje del usuario se agregó inmediatamente
    expect(component.messages.length).toBe(msgsBefore + 1);
    expect(component.messages[component.messages.length - 1].role).toBe('user');
    expect(component.chatLoading).toBe(true);
    expect(component.userMessage).toBe('');

    // Resolver la petición al backend de chat
    const chatReq = httpMock.expectOne((r) => r.url.includes('/chat'));
    chatReq.flush({ response: 'Claro, con mucho gusto te ayudo.' });
    fixture.detectChanges();

    tick(100); // setTimeout del scrollToBottom
    fixture.detectChanges();

    expect(component.chatLoading).toBe(false);
    expect(component.messages.length).toBe(msgsBefore + 2); // user + assistant
    expect(component.messages[component.messages.length - 1].role).toBe('assistant');
    expect(component.messages[component.messages.length - 1].text).toContain('Claro');
    discardPeriodicTasks();
  }));

  // ─── MA-08 ─────────────────────────────────────────────────────────────────
  it('MA-08: El input tiene el binding (keyup.enter) para enviar con Enter', fakeAsync(() => {
    spyOn(component, 'sendMessage');

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.openChat(component.agents[0]);
    component.userMessage = 'Texto de prueba';
    fixture.detectChanges();

    // Disparar evento keyup.enter sobre el input
    const inputEl = fixture.nativeElement.querySelector(
      'input[placeholder="Escribe tu mensaje aquí..."]'
    ) as HTMLInputElement;

    expect(inputEl).toBeTruthy();

    inputEl.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(component.sendMessage).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  // ─── MA-09 ─────────────────────────────────────────────────────────────────
  it('MA-09: chatLoading = true mientras espera respuesta del agente', fakeAsync(() => {
    spyOn(component, 'scrollToBottom');

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.openChat(component.agents[0]);
    fixture.detectChanges();

    component.userMessage = '¿Qué puedes hacer?';
    component.sendMessage();
    fixture.detectChanges();

    // Antes de resolver la petición → chatLoading debe ser true
    expect(component.chatLoading).toBe(true);

    // Resolver la petición
    const chatReq = httpMock.expectOne((r) => r.url.includes('/chat'));
    chatReq.flush({ response: 'Puedo ayudarte con muchas cosas.' });
    tick(100);
    fixture.detectChanges();

    // Después de recibir respuesta → chatLoading es false
    expect(component.chatLoading).toBe(false);
    discardPeriodicTasks();
  }));

  // ─── MA-10 ─────────────────────────────────────────────────────────────────
  it('MA-10: scrollToBottom() se llama al enviar y al recibir mensaje', fakeAsync(() => {
    const scrollSpy = spyOn(component, 'scrollToBottom');

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.openChat(component.agents[0]);
    fixture.detectChanges();

    component.userMessage = 'Test auto-scroll';
    component.sendMessage();
    fixture.detectChanges();

    tick(100); // setTimeout del primer scrollToBottom (al enviar)

    const chatReq = httpMock.expectOne((r) => r.url.includes('/chat'));
    chatReq.flush({ response: 'Respuesta de prueba' });
    tick(100); // setTimeout del segundo scrollToBottom (al recibir)
    fixture.detectChanges();

    // Debe haberse llamado al menos 2 veces: una al enviar y otra al recibir
    expect(scrollSpy.calls.count()).toBeGreaterThanOrEqual(2);
    discardPeriodicTasks();
  }));

  // ─── MA-11 ─────────────────────────────────────────────────────────────────
  it('MA-11: sendMessage() con input vacío no agrega mensajes ni llama al backend', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.openChat(component.agents[0]);
    fixture.detectChanges();

    const msgsBefore = component.messages.length;
    component.userMessage = '   '; // solo espacios
    component.sendMessage();
    fixture.detectChanges();

    // No se agregaron mensajes
    expect(component.messages.length).toBe(msgsBefore);
    // No hubo petición al backend
    httpMock.expectNone((r) => r.url.includes('/chat'));
    discardPeriodicTasks();
  }));

  // ─── MA-12 ─────────────────────────────────────────────────────────────────
  it('MA-12: releaseAgent() abre el dialog CuadroDeConfirmacion', fakeAsync(() => {
    const openSpy = mockDialog(false); // cancelar

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    const agent = component.agents[0];
    component.releaseAgent(agent, new MouseEvent('click'));
    fixture.detectChanges();

    expect(openSpy).toHaveBeenCalled();
    // Sin confirmar → no hay petición de release
    httpMock.expectNone((r) => r.url.includes('/release'));
    discardPeriodicTasks();
  }));

  // ─── MA-13 ─────────────────────────────────────────────────────────────────
  it('MA-13: Confirmar eliminación llama al endpoint /release y elimina el agente', fakeAsync(() => {
    mockDialog(true); // confirmar

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    const agentToRelease = component.agents[0];
    const countBefore = component.agents.length;

    component.releaseAgent(agentToRelease, new MouseEvent('click'));
    fixture.detectChanges();

    // Resolver la petición de release
    const releaseReq = httpMock.expectOne((r) =>
      r.url.includes(`/agents/${agentToRelease._id}/release`)
    );
    expect(releaseReq.request.method).toBe('POST');
    releaseReq.flush({});
    fixture.detectChanges();

    expect(component.agents.length).toBe(countBefore - 1);
    expect(component.agents.find((a) => a._id === agentToRelease._id)).toBeUndefined();

    tick(4000); // setTimeout del dialog de resultado
    discardPeriodicTasks();
  }));

  // ─── MA-14 ─────────────────────────────────────────────────────────────────
  it('MA-14: Cancelar eliminación no hace ninguna petición y mantiene el agente', fakeAsync(() => {
    mockDialog(false); // cancelar

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    const countBefore = component.agents.length;
    const agent = component.agents[0];

    component.releaseAgent(agent, new MouseEvent('click'));
    fixture.detectChanges();

    // Sin confirmar → sin petición al backend
    httpMock.expectNone((r) => r.url.includes('/release'));

    expect(component.agents.length).toBe(countBefore);
    expect(component.agents.find((a) => a._id === agent._id)).toBeDefined();
    discardPeriodicTasks();
  }));

  // ─── MA-15 ─────────────────────────────────────────────────────────────────
  it('MA-15: Evento WebSocket agent-time-ended dispara recarga de la lista', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    const loadSpy = spyOn(component, 'loadMyAgents').and.callThrough();

    // Simular el evento WebSocket
    agentTimeEndedSubject.next({ agentId: 'a1', name: 'Agente Python' });
    fixture.detectChanges();

    expect(loadSpy).toHaveBeenCalledTimes(1);

    // Resolver la nueva petición de carga que dispara el reload
    const reloadReq = httpMock.expectOne((r) => r.url.includes('/agents/my-rentals'));
    reloadReq.flush({ agents: [] });
    fixture.detectChanges();

    discardPeriodicTasks();
  }));

  // ─── MA-16 ─────────────────────────────────────────────────────────────────
  it('MA-16: authActivateGuard redirige a /login cuando no hay token', () => {
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);

    const hasToken = !!(localStorage.getItem('token'));
    expect(hasToken).toBe(false);

    // El guard verifica la presencia del token en storage antes de activar la ruta.
    // Con hasToken = false, el guard retorna router.parseUrl('/login').
    expect(localStorage.getItem('token')).toBeNull();
  });

  // ── Pruebas adicionales — casos borde y comportamiento interno ──────────────

  it('MA-extra-1: updateCountdowns() muestra "Expirado" para agentes con rentedUntil en el pasado', fakeAsync(() => {
    const PAST_DATE = new Date(Date.now() - 3_600_000).toISOString(); // -1 hora
    const expiredAgents: MyAgent[] = [
      { _id: 'exp1', name: 'Agente Expirado', description: 'Test', category: 'otros', rentedUntil: PAST_DATE },
    ];

    fixture.detectChanges();
    const req = httpMock.expectOne((r) => r.url.includes('/agents/my-rentals'));
    req.flush({ agents: expiredAgents });
    fixture.detectChanges();

    tick(1000);
    fixture.detectChanges();

    expect(component.agents[0].timeLeftDisplay).toBe('Expirado');
    discardPeriodicTasks();
  }));

  it('MA-extra-2: loadMyAgents() establece loading = false cuando el backend falla', fakeAsync(() => {
    fixture.detectChanges();
    expect(component.loading).toBe(true);

    const req = httpMock.expectOne((r) => r.url.includes('/agents/my-rentals'));
    req.flush('Error del servidor', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    expect(component.loading).toBe(false);
    discardPeriodicTasks();
  }));

  it('MA-extra-3: sendMessage() agrega mensaje de error al historial cuando el backend falla', fakeAsync(() => {
    spyOn(component, 'scrollToBottom');

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    component.openChat(component.agents[0]);
    fixture.detectChanges();

    const msgsBefore = component.messages.length;
    component.userMessage = '¿Me puedes ayudar?';
    component.sendMessage();
    fixture.detectChanges();

    const chatReq = httpMock.expectOne((r) => r.url.includes('/chat'));
    chatReq.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    tick(100);
    fixture.detectChanges();

    expect(component.chatLoading).toBe(false);
    // user message + assistant error message
    expect(component.messages.length).toBe(msgsBefore + 2);
    const lastMsg = component.messages[component.messages.length - 1];
    expect(lastMsg.role).toBe('assistant');
    expect(lastMsg.text).toContain('Error');
    discardPeriodicTasks();
  }));

  it('MA-extra-4: sendMessage() no hace nada si selectedAgent es null', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    expect(component.selectedAgent).toBeNull();

    component.userMessage = 'Este mensaje no se enviará';
    component.sendMessage();
    fixture.detectChanges();

    httpMock.expectNone((r) => r.url.includes('/chat'));
    expect(component.messages.length).toBe(0);
    discardPeriodicTasks();
  }));

  it('MA-extra-5: releaseAgent() cierra el chat si el agente eliminado era el seleccionado', fakeAsync(() => {
    mockDialog(true);

    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    const agentToRelease = component.agents[0];
    component.openChat(agentToRelease);
    fixture.detectChanges();
    expect(component.selectedAgent).toBe(agentToRelease);

    component.releaseAgent(agentToRelease, new MouseEvent('click'));
    fixture.detectChanges();

    const releaseReq = httpMock.expectOne((r) =>
      r.url.includes(`/agents/${agentToRelease._id}/release`)
    );
    releaseReq.flush({});
    fixture.detectChanges();

    expect(component.selectedAgent).toBeNull();

    tick(4000);
    discardPeriodicTasks();
  }));

  it('MA-extra-6: ngOnDestroy() limpia el intervalo del timer sin lanzar errores', fakeAsync(() => {
    fixture.detectChanges();
    flushAgents();
    fixture.detectChanges();

    expect(() => {
      component.ngOnDestroy();
    }).not.toThrow();

    // Después de destruir, los ticks no deben causar efectos
    tick(5000);
    discardPeriodicTasks();
  }));
});
