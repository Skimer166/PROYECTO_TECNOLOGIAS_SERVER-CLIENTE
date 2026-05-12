import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { Login } from './login';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth';
import { from } from 'rxjs';
import { Location } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('Login', () => {
  let component: Login;
  let authMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;
  let dialogMock: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj('AuthService', ['login', 'requestPasswordReset', 'getGoogleLoginUrl']);
    routerMock = jasmine.createSpyObj('Router', ['navigate']);
    dialogMock = jasmine.createSpyObj('MatDialog', ['open']);

    authMock.login.and.returnValue(from(Promise.resolve({ token: 'Bearer1234' })));
    dialogMock.open.and.returnValue({ close: jasmine.createSpy('close') } as unknown as MatDialogRef<unknown>);

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideAnimationsAsync(),
        FormBuilder,
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
        { provide: Location, useValue: {} },
        { provide: MatDialog, useValue: dialogMock },
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call auth.login and navigate on valid submit', fakeAsync(() => {
    spyOn(window.localStorage, 'setItem');
    component.form.setValue({ Correo: 'test@mail.com', Contrasena: '12345678' });
    component.doOnSubmit();
    expect(authMock.login).toHaveBeenCalledOnceWith({
      email: 'test@mail.com',
      password: '12345678'
    });
    flushMicrotasks();
    tick(4000);
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'Bearer1234');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/home-page']);
  }));

  it('should not call auth.login if form is invalid', fakeAsync(() => {
    authMock.login.calls.reset();
    component.form.setValue({ Correo: '', Contrasena: '' });
    component.doOnSubmit();
    tick(4000);
    expect(authMock.login).not.toHaveBeenCalled();
  }));
});
