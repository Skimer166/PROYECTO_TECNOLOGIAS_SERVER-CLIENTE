import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { Login } from './login';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth';
import { from } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';

describe('Login', () => {
  let component: Login;
  let authMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authMock = jasmine.createSpyObj('AuthService', ['login', 'requestPasswordReset', 'getGoogleLoginUrl']);
    authMock.login.and.returnValue(from(Promise.resolve({ token: 'Bearer1234' })));

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideAnimationsAsync(),
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call auth.login and navigate on valid submit', fakeAsync(() => {
    spyOn(component as unknown as { openDialog: () => void }, 'openDialog');
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    spyOn(window.localStorage, 'setItem');

    component.form.setValue({ Correo: 'test@mail.com', Contrasena: '12345678' });
    component.doOnSubmit();

    expect(authMock.login).toHaveBeenCalledOnceWith({
      email: 'test@mail.com',
      password: '12345678'
    });
    flushMicrotasks();
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'Bearer1234');
    expect(router.navigate).toHaveBeenCalledWith(['/home-page']);
  }));

  it('should not call auth.login if form is invalid', () => {
    spyOn(component as unknown as { openDialog: () => void }, 'openDialog');
    authMock.login.calls.reset();
    component.form.setValue({ Correo: '', Contrasena: '' });
    component.doOnSubmit();
    expect(authMock.login).not.toHaveBeenCalled();
  });
});
