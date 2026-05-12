import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

describe('RG — Register Page', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('RG-01: crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('RG-02: formulario válido', () => {
    component.form.setValue({
      Nombre: 'Lilia',
      Correo: 'lilia@test.com',
      Contraseña: 'password123',
      Confirmar_contraseña: 'password123',
      Terms: true,
    });

    expect(component.form.valid).toBeTrue();
  });

  it('RG-03: componente renderiza correctamente', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('RG-04: nombre corto inválido', () => {
    const ctrl = component.form.get('Nombre');

    ctrl?.setValue('A');

    expect(ctrl?.invalid).toBeTrue();
  });

  it('RG-05: email inválido', () => {
    const ctrl = component.form.get('Correo');

    ctrl?.setValue('correo-invalido');

    expect(ctrl?.hasError('email')).toBeTrue();
  });

  it('RG-06: password corta inválida', () => {
    const ctrl = component.form.get('Contraseña');

    ctrl?.setValue('123');

    expect(ctrl?.hasError('minlength')).toBeTrue();
  });

  it('RG-07: passwords distintas generan mismatch', () => {
    component.form.patchValue({
      Contraseña: 'password123',
      Confirmar_contraseña: 'different123',
    });

    component.form.updateValueAndValidity();

    expect(
      component.form.get('Confirmar_contraseña')?.hasError('mismatch')
    ).toBeTrue();
  });

  it('RG-08: términos requeridos', () => {
    component.form.setValue({
      Nombre: 'Lilia',
      Correo: 'lilia@test.com',
      Contraseña: 'password123',
      Confirmar_contraseña: 'password123',
      Terms: false,
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('RG-09: formulario vacío inválido', () => {
    component.form.setValue({
      Nombre: '',
      Correo: '',
      Contraseña: '',
      Confirmar_contraseña: '',
      Terms: false,
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('RG-10: renderiza botones', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(buttons.length).toBeGreaterThan(0);
  });

  it('RG-11: formulario inicia inválido', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('RG-12: existe link de login', () => {
    const links = fixture.nativeElement.querySelectorAll('a');

    expect(links.length).toBeGreaterThan(0);
  });

  it('RG-13: renderiza título register', () => {
    expect(fixture.nativeElement.textContent)
      .toContain('Crea tu cuenta');
  });

  it('RG-14: renderiza formulario', () => {
    const form = fixture.nativeElement.querySelector('form');

    expect(form).toBeTruthy();
  });

  it('RG-15: control Nombre existe', () => {
    expect(component.form.get('Nombre')).toBeTruthy();
  });

  it('RG-16: control Correo existe', () => {
    expect(component.form.get('Correo')).toBeTruthy();
  });

  it('RG-17: control Contraseña existe', () => {
    expect(component.form.get('Contraseña')).toBeTruthy();
  });

  it('RG-18: control Confirmar_contraseña existe', () => {
    expect(
      component.form.get('Confirmar_contraseña')
    ).toBeTruthy();
  });

  it('RG-19: control Terms existe', () => {
    expect(component.form.get('Terms')).toBeTruthy();
  });

  it('RG-20: formulario inválido si Nombre vacío', () => {
    component.form.setValue({
      Nombre: '',
      Correo: 'lilia@test.com',
      Contraseña: 'password123',
      Confirmar_contraseña: 'password123',
      Terms: true,
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('RG-21: formulario inválido si Correo vacío', () => {
    component.form.setValue({
      Nombre: 'Lilia',
      Correo: '',
      Contraseña: 'password123',
      Confirmar_contraseña: 'password123',
      Terms: true,
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('RG-22: formulario inválido si password vacía', () => {
    component.form.setValue({
      Nombre: 'Lilia',
      Correo: 'lilia@test.com',
      Contraseña: '',
      Confirmar_contraseña: '',
      Terms: true,
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('RG-23: checkbox Terms false invalida form', () => {
    component.form.setValue({
      Nombre: 'Lilia',
      Correo: 'lilia@test.com',
      Contraseña: 'password123',
      Confirmar_contraseña: 'password123',
      Terms: false,
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('RG-24: passwords iguales eliminan mismatch', () => {
    component.form.patchValue({
      Contraseña: 'password123',
      Confirmar_contraseña: 'password123',
    });

    component.form.updateValueAndValidity();

    expect(
      component.form.get('Confirmar_contraseña')
        ?.hasError('mismatch')
    ).toBeFalse();
  });

  it('RG-25: formulario válido con todos los campos correctos', () => {
    component.form.setValue({
      Nombre: 'Lilia',
      Correo: 'lilia@test.com',
      Contraseña: 'password123',
      Confirmar_contraseña: 'password123',
      Terms: true,
    });

    expect(component.form.valid).toBeTrue();
  });

});