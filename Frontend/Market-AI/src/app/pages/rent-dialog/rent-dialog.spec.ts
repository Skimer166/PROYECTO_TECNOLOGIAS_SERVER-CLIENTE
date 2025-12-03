import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RentDialogComponent } from './rent-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
// CAMBIO: Usamos provideAnimationsAsync (la nueva API)
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('RentDialogComponent (Unitarias)', () => {
  let component: RentDialogComponent;
  let fixture: ComponentFixture<RentDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentDialogComponent],
      providers: [
        // Reemplazo de provideNoopAnimations()
        provideAnimationsAsync(), 
        { provide: MatDialogRef, useValue: {} },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { agent: { name: 'Agente Test', pricePerHour: 10 } } 
        }
      ]
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