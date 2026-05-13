import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RentDialogComponent } from './rent-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// ══════════════════════════════════════════════════════════════════════════════
// Suite original (ya existía — se conserva sin modificar)
// ══════════════════════════════════════════════════════════════════════════════
describe('RentDialogComponent (Unitarias)', () => {
  let component: RentDialogComponent;
  let fixture: ComponentFixture<RentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: {} },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { agent: { name: 'Agente Test', pricePerHour: 10 } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Prueba Unitaria 1: Calcular costo por horas (5 horas * $10 = $50)', () => {
    component.amount = 5;
    component.unit = 'hours';
    expect(component.calculateTotal()).toBe(50);
  });

  it('Prueba Unitaria 2: Calcular costo por días (1 día * 24h * $10 = $240)', () => {
    component.amount = 1;
    component.unit = 'days';
    expect(component.calculateTotal()).toBe(240);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Suite RD-01 a RD-07 — Rent Dialog
// ══════════════════════════════════════════════════════════════════════════════
describe('RD — Rent Dialog (RD-01 a RD-07)', () => {
  let component: RentDialogComponent;
  let fixture: ComponentFixture<RentDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<RentDialogComponent>>;

  const AGENT_DATA = { agent: { name: 'Agente Marketing Pro', pricePerHour: 10 } };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [RentDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: AGENT_DATA },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RentDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function getButton(label: string): HTMLButtonElement | undefined {
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    return Array.from(buttons).find((b) => b.textContent?.trim().includes(label));
  }

  // ─── RD-01 ─────────────────────────────────────────────────────────────────
  it('RD-01: El dialog muestra el nombre y el precio del agente', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // Título: "Rentar {nombre}"
    const title = compiled.querySelector('[mat-dialog-title]')?.textContent ?? '';
    expect(title).toContain('Agente Marketing Pro');

    // Cuerpo: precio por hora
    const content = compiled.querySelector('mat-dialog-content')?.textContent ?? '';
    expect(content).toContain('10');
    expect(content).toContain('hora');
  });

  // ─── RD-02 ─────────────────────────────────────────────────────────────────
  it('RD-02: El total se recalcula en tiempo real al cambiar cantidad y unidad', () => {
    // amount=1, hours → 1*1*10 = 10
    component.amount = 1;
    component.unit = 'hours';
    expect(component.calculateTotal()).toBe(10);

    // amount=3, hours → 3*1*10 = 30
    component.amount = 3;
    expect(component.calculateTotal()).toBe(30);

    // amount=3, days → 3*24*10 = 720
    component.unit = 'days';
    expect(component.calculateTotal()).toBe(720);

    // amount=3, months → 3*720*10 = 21 600
    component.unit = 'months';
    expect(component.calculateTotal()).toBe(21_600);
  });

  // ─── RD-03 ─────────────────────────────────────────────────────────────────
  it('RD-03: 2 horas × $10/hr = 20 créditos', () => {
    component.amount = 2;
    component.unit = 'hours';
    expect(component.calculateTotal()).toBe(20);
  });

  // ─── RD-04 ─────────────────────────────────────────────────────────────────
  it('RD-04: Botón "Confirmar Renta" cierra el dialog con { amount, unit, total }', () => {
    component.amount = 3;
    component.unit = 'days'; // 3 * 24 * 10 = 720
    fixture.detectChanges();

    const confirmBtn = getButton('Confirmar Renta');
    expect(confirmBtn).toBeTruthy();

    confirmBtn!.click();
    fixture.detectChanges();

    // El directive [mat-dialog-close] llama a dialogRef.close(value)
    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      amount: 3,
      unit: 'days',
      total: 720,
    });
  });

  // ─── RD-05 ─────────────────────────────────────────────────────────────────
  it('RD-05: calculateTotal devuelve el monto correcto para que el padre verifique créditos', () => {
    // El dialog no conoce el saldo — solo calcula el total.
    // La verificación de créditos insuficientes es responsabilidad del HomePage
    // (llama a processRent() tras afterClosed()).
    component.amount = 9999;
    component.unit = 'months'; // 9999 * 720 * 10 = 71 992 800
    const total = component.calculateTotal();
    expect(total).toBe(71_992_800);

    // El total se pasa al padre al confirmar — es el padre quien recibe el error 4xx
    expect(typeof total).toBe('number');
  });

  // ─── RD-06 ─────────────────────────────────────────────────────────────────
  it('RD-06: Botón "Cancelar" cierra el dialog sin datos de renta', () => {
    fixture.detectChanges();

    const cancelBtn = getButton('Cancelar');
    expect(cancelBtn).toBeTruthy();

    cancelBtn!.click();
    fixture.detectChanges();

    // mat-dialog-close sin valor pasa '' (string vacío)
    expect(dialogRefSpy.close).toHaveBeenCalled();
    // No se pasaron datos de renta
    const callArg = dialogRefSpy.close.calls.mostRecent().args[0];
    expect(callArg).toBe('');
  });

  // ─── RD-07 ─────────────────────────────────────────────────────────────────
  it('RD-07: amount = 0 → total = 0 (cantidad inválida)', () => {
    component.amount = 0;
    component.unit = 'hours';
    expect(component.calculateTotal()).toBe(0);
  });

  it('RD-07b: amount negativo → total negativo (fuera del rango válido)', () => {
    component.amount = -5;
    component.unit = 'hours';
    expect(component.calculateTotal()).toBeLessThan(0);
  });

  it('RD-07c: El template muestra el total en tiempo real (binding de calculateTotal())', () => {
    component.amount = 4;
    component.unit = 'hours'; // 4 * 1 * 10 = 40
    fixture.detectChanges();

    const totalEl = fixture.nativeElement.querySelector('.total-cost strong') as HTMLElement;
    expect(totalEl).toBeTruthy();
    expect(totalEl.textContent).toContain('40');
  });

  // ── Pruebas adicionales — estado inicial y multiplicador de meses ───────────

  it('RD-extra-1: Estado inicial al abrir: amount = 1 y unit = "hours"', () => {
    expect(component.amount).toBe(1);
    expect(component.unit).toBe('hours');
  });

  it('RD-extra-2: Multiplicador de meses: 1 mes × $10/hr = 7200 créditos', () => {
    component.amount = 1;
    component.unit = 'months'; // 1 * 720 * 10 = 7200
    expect(component.calculateTotal()).toBe(7200);
  });
});
