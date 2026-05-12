import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ResetPassword } from './reset-password';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router, convertToParamMap } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../shared/services/auth';

function makeActivatedRouteMock(token: string | null = 'test-token') {
  return {
    snapshot: {
      queryParamMap: convertToParamMap(token ? { token } : {}),
    },
  };
}

describe('RP — Reset Password Page', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let authMock: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let locationSpy: jasmine.SpyObj<Location>;

  async function setup(token: string | null = 'test-token') {
    authMock = jasmine.createSpyObj('AuthService', ['resetPassword']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    locationSpy = jasmine.createSpyObj('Location', ['back']);

    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerSpy },
        { provide: Location, useValue: locationSpy },
        {
          provide: ActivatedRoute,
          useValue: makeActivatedRouteMock(token),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('RP-01: carga formulario con token válido', async () => {
    await setup('valid-token');

    expect(component.hasToken).toBeTrue();
    expect(component.token).toBe('valid-token');
  });

  it('RP-02: sin token hasToken es false', async () => {
    await setup(null);

    expect(component.hasToken).toBeFalse();
    expect(component.token).toBeNull();
  });

  it('RP-03: reset exitoso navega a login', fakeAsync(async () => {
    await setup('valid-token');

    authMock.resetPassword.and.returnValue(of({}));

    spyOn(
      (
        component as unknown as {
          dialog: {
            open: jasmine.Spy;
          };
        }
      ).dialog,
      'open'
    ).and.returnValue({
      close: jasmine.createSpy('close'),
    } as unknown as ReturnType<
      jasmine.Spy
    >);

    component.form.setValue({
      Contrasena: 'password123',
      ConfirmarContrasena: 'password123',
    });

    component.onSubmit();
    tick();

    expect(authMock.resetPassword).toHaveBeenCalledWith(
      'valid-token',
      'password123'
    );

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('RP-04: token inválido abre dialog error', fakeAsync(async () => {
    await setup('expired-token');

    authMock.resetPassword.and.returnValue(
      throwError(() => ({ status: 400 }))
    );

    const dialogOpenSpy = spyOn(
        (
          component as unknown as {
            dialog: {
              open: jasmine.Spy;
            };
          }
        ).dialog,
        'open'
      ).and.returnValue({
      close: jasmine.createSpy('close'),
    } as unknown as ReturnType<
      jasmine.Spy
    >);

    component.form.setValue({
      Contrasena: 'password123',
      ConfirmarContrasena: 'password123',
    });

    component.onSubmit();
    tick();

    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

  it('RP-05: password corta es inválida', async () => {
    await setup();

    const ctrl = component.form.get('Contrasena')!;

    ctrl.setValue('123');

    expect(ctrl.hasError('minlength')).toBeTrue();
  });

  it('RP-06: passwords distintas generan mismatch', async () => {
    await setup();

    component.form.patchValue({
      Contrasena: 'password123',
      ConfirmarContrasena: 'password999',
    });

    component.form.updateValueAndValidity();

    expect(
      component.form.get('ConfirmarContrasena')?.hasError('mismatch')
    ).toBeTrue();
  });

  it('RP-07: onCancel llama location.back()', async () => {
    await setup();

    component.onCancel();

    expect(locationSpy.back).toHaveBeenCalled();
  });

  it('RP-08: formulario vacío es inválido', async () => {
    await setup();

    component.form.setValue({
      Contrasena: '',
      ConfirmarContrasena: '',
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('RP-09: formulario inválido con password vacía', () => {
    component.form.setValue({
      Contrasena: '',
      ConfirmarContrasena: '',
    });

    expect(component.form.invalid).toBeTrue();
  });

  it('RP-10: formulario acepta passwords iguales', async () => {
    await setup();

    component.form.patchValue({
      Contrasena: 'password123',
      ConfirmarContrasena: 'password123',
    });

    component.form.updateValueAndValidity();

    expect(component.form.valid).toBeTrue();
  });
});