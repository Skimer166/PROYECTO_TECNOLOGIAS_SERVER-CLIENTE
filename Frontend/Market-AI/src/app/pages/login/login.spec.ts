import { Login } from './login';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth';
import { from } from 'rxjs';

describe('Login', () => {
  let component: Login;
  let authMock: AuthService;
  let routerMock: Router;

  beforeEach(() => {
    routerMock = {
      navigate: jasmine.createSpy('navigate')
    } as unknown as Router;

    authMock = {
      login: jasmine
        .createSpy('login')
        .and.returnValue(from(Promise.resolve({ token: 'Bearer1234' })))
    } as unknown as AuthService;

    component = new Login(new FormBuilder(), authMock, routerMock);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call auth.login and navigate on valid submit', async () => {
    spyOn(window.localStorage, 'setItem');
    component.form.setValue({ Correo: 'test@mail.com', Contrasena: '12345678' });
    component.doOnSubmit();
    expect((authMock.login as any)).toHaveBeenCalledOnceWith({
      email: 'test@mail.com',
      password: '12345678'
    });
    await Promise.resolve();
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'Bearer1234');
    expect((routerMock.navigate as any)).toHaveBeenCalledWith(['/home-page']);
  });

  it('should not call auth.login if form is invalid', () => {
    (authMock.login as any).calls.reset();
    component.form.setValue({ Correo: '', Contrasena: '' });
    component.doOnSubmit();
    expect((authMock.login as any)).not.toHaveBeenCalled();
  });
});

