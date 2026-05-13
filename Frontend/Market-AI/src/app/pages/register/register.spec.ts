import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
// CAMBIO: Importar desde .../animations/async
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { of } from 'rxjs';

describe('Register Component (Unitarias)', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register, MatDialogModule],
      providers: [
        // Reemplazo aquí
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('Prueba Unitaria 3: Validación personalizada (Match Password)', () => {
    const pass = component.form.get('Contraseña');
    const confirm = component.form.get('Confirmar_contraseña');

    pass?.setValue('12345678');
    confirm?.setValue('87654321'); 

    component.form.updateValueAndValidity();

    expect(component.form.hasError('mismatch') || confirm?.hasError('mismatch')).toBeTrue();
    expect(component.form.valid).toBeFalse();
  });

  it('Prueba Unitaria 4: Validación de formulario completo', () => {
    component.form.patchValue({
      Nombre: 'Usuario Test',
      Correo: 'test@correo.com',
      Contraseña: 'password123',
      Confirmar_contraseña: 'password123',
      Terms: true
    });

    expect(component.form.valid).toBeTrue();
  });
});