import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationDialogComponent } from './popup-login';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// ══════════════════════════════════════════════════════════════════════════════
// Suite ND-01 → ND-03 — NotificationDialog
// ══════════════════════════════════════════════════════════════════════════════
describe('ND — NotificationDialog (Unitarias)', () => {
  let fixture: ComponentFixture<NotificationDialogComponent>;
  let component: NotificationDialogComponent;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<NotificationDialogComponent>>;

  async function setupWithData(type: 'success' | 'error', message = 'Mensaje de prueba') {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<NotificationDialogComponent>>(
      'MatDialogRef',
      ['close']
    );

    await TestBed.configureTestingModule({
      imports: [NotificationDialogComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { message, type } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  // ─── ND-01 ─────────────────────────────────────────────────────────────────
  it('ND-01: Dialog de éxito recibe data con type="success" y muestra el mensaje', async () => {
    await setupWithData('success', 'Operación completada correctamente');

    expect(component.data.type).toBe('success');
    expect(component.data.message).toBe('Operación completada correctamente');

    const title = fixture.nativeElement.querySelector('.notify-title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Operación completada correctamente');
  });

  // ─── ND-02 ─────────────────────────────────────────────────────────────────
  it('ND-02: Dialog de error recibe data con type="error" y muestra el mensaje', async () => {
    await setupWithData('error', 'Ha ocurrido un error inesperado');

    expect(component.data.type).toBe('error');
    expect(component.data.message).toBe('Ha ocurrido un error inesperado');

    const title = fixture.nativeElement.querySelector('.notify-title') as HTMLElement;
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('Ha ocurrido un error inesperado');
  });

  // ─── ND-03 ─────────────────────────────────────────────────────────────────
  it('ND-03: El botón "Cerrar" llama a dialogRef.close()', async () => {
    await setupWithData('success', 'Auto-cierre test');

    const closeBtn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.textContent?.trim()).toContain('Cerrar');

    closeBtn.click();
    fixture.detectChanges();

    expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
  });

  // ── Pruebas adicionales de casos borde ──────────────────────────────────────

  it('ND-extra-1: El componente se crea correctamente (smoke test)', async () => {
    await setupWithData('success', 'Test de creación');
    expect(component).toBeTruthy();
    expect(component.data.message).toBe('Test de creación');
    expect(component.data.type).toBe('success');
  });

  it('ND-extra-2: El método close() del componente llama a dialogRef.close() directamente', async () => {
    await setupWithData('error', 'Cerrar directo');
    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
  });
});
