import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Login } from './login';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, from } from 'rxjs';
import { AuthService } from '../../shared/services/auth';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';

describe('LG — Login Page', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  let authMock: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let locationSpy: jasmine.SpyObj<Location>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj('AuthService', [
      'login',
      'requestPasswordReset',
      'setTokenFromOAuth',
      'getToken',
      'getGoogleLoginUrl'
    ]);

    authMock.login.and.returnValue(
      from(Promise.resolve({ token: 'Bearer1234' }))
    );

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    locationSpy = jasmine.createSpyObj('Location', ['back']);

    dialogSpy.open.and.returnValue({
      close: jasmine.createSpy('close'),
    } as unknown as ReturnType<MatDialog['open']>);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Location, useValue: locationSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;

    spyOn(
      component as Login & {
        openDialog: (
          title: string,
          message: string,
          type: string
        ) => void;
      },
      'openDialog'
    ).and.stub();

    fixture.detectChanges();
  });

  it('LG-01: crea el componente', () => {
    expect(component).toBeTruthy();
  });

  it('LG-02: login exitoso', () => {
    authMock.login.and.returnValue(
      of({
        token: 'jwt-token',
      })
    );

    component.form.setValue({
      Correo: 'lilia@test.com',
      Contrasena: 'password123',
    });

    component.doOnSubmit();

    expect(authMock.login).toHaveBeenCalled();
  });

  it('LG-03: credenciales incorrectas', () => {
    authMock.login.and.returnValue(
      throwError(() => ({
        error: {
          message: 'Invalid credentials',
        },
      }))
    );

    component.form.setValue({
      Correo: 'lilia@test.com',
      Contrasena: 'incorrecta',
    });

    component.doOnSubmit();

    expect(
      (
        component as unknown as {
          openDialog: jasmine.Spy;
        }
      ).openDialog
    ).toHaveBeenCalled();
  });

  it('LG-04: usuario no existe', () => {
    authMock.login.and.returnValue(
      throwError(() => ({
        error: {
          message: 'User not found',
        },
      }))
    );

    component.form.setValue({
      Correo: 'none@test.com',
      Contrasena: 'password123',
    });

    component.doOnSubmit();

    expect(
      (
        component as unknown as {
          openDialog: jasmine.Spy;
        }
      ).openDialog
    ).toHaveBeenCalled();
  });

  it('LG-05: email inválido', () => {
    const ctrl = component.form.get('Correo');

    ctrl?.setValue('correo-invalido');

    expect(ctrl?.invalid).toBeTrue();
  });

  it('LG-06: control password existe', () => {
    const ctrl = component.form.get('Contrasena');

    expect(ctrl).toBeTruthy();
  });

  it('LG-07: formulario vacío inválido', () => {
    component.form.setValue({
      Correo: '',
      Contrasena: '',
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('LG-08: form inicia inválido', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('LG-09: cancelar ejecuta back()', () => {
    component.onCancel();

    expect(locationSpy.back).toHaveBeenCalled();
  });

  it('LG-10: existe link de register', () => {
    const links = fixture.nativeElement.querySelectorAll('a');

    expect(links.length).toBeGreaterThan(0);
  });

  it('LG-11: renderiza botones', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(buttons.length).toBeGreaterThan(0);
  });

  it('LG-12: renderiza título login', () => {
    expect(fixture.nativeElement.textContent)
      .toContain('Inicia sesion');
  });

  it('LG-13: formulario válido', () => {
    component.form.setValue({
      Correo: 'lilia@test.com',
      Contrasena: 'password123',
    });

    expect(component.form.valid).toBeTrue();
  });

  it('LG-14: navega a home después de login exitoso', () => {
    authMock.login.and.returnValue(
      of({
        token: 'jwt-token',
      })
    );

    component.form.setValue({
      Correo: 'lilia@test.com',
      Contrasena: 'password123',
    });

    component.doOnSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home-page']);
  });

  it('LG-15: openDialog se ejecuta en login exitoso', () => {
    authMock.login.and.returnValue(
      of({
        token: 'jwt-token',
      })
    );

    component.form.setValue({
      Correo: 'lilia@test.com',
      Contrasena: 'password123',
    });

    component.doOnSubmit();

    expect(
      (
        component as unknown as {
          openDialog: jasmine.Spy;
        }
      ).openDialog
    ).toHaveBeenCalled();
  });

  it('LG-16: formulario permanece inválido con email vacío', () => {
    component.form.setValue({
      Correo: '',
      Contrasena: 'password123',
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('LG-17: formulario permanece inválido con password vacía', () => {
    component.form.setValue({
      Correo: 'lilia@test.com',
      Contrasena: '',
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('LG-18: control email existe', () => {
    expect(component.form.get('Correo')).toBeTruthy();
  });

  it('LG-19: openDialog puede ejecutarse manualmente', () => {
    expect(() => {
      (
        component as unknown as {
          openDialog: (title: string, message: string) => void;
        }
      ).openDialog(
        'Titulo',
        'Mensaje'
      );
    }).not.toThrow();
  });

  it('LG-20: login exitoso guarda token y navega', fakeAsync(() => {
    
    spyOn(window.localStorage, 'setItem');

    component.form.setValue({
      Correo: 'test@mail.com',
      Contrasena: '12345678'
    });

    component.doOnSubmit();

    expect(authMock.login).toHaveBeenCalledOnceWith({
      email: 'test@mail.com',
      password: '12345678'
    });

    flushMicrotasks();

    expect(window.localStorage.setItem)
      .toHaveBeenCalledWith('token', 'Bearer1234');

    expect(routerSpy.navigate)
      .toHaveBeenCalledWith(['/home-page']);
  }));

  it('LG-21: no llama login si el form es inválido', () => {
    authMock.login.calls.reset();

    component.form.setValue({
      Correo: '',
      Contrasena: ''
    });

    component.doOnSubmit();

    expect(authMock.login).not.toHaveBeenCalled();
  });
});
