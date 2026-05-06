import { Login } from './login';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth';
import { from } from 'rxjs';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

describe('Login', () => {
  let component: Login;
  let authMock: AuthService;
  let routerMock: Router;
  let locationMock: Location;
  let dialogMock: MatDialog;

  beforeEach(() => {
    routerMock = {
      navigate: jasmine.createSpy('navigate')
    } as unknown as Router;

    authMock = {
      login: jasmine
        .createSpy('login')
        .and.returnValue(from(Promise.resolve({ token: 'Bearer1234' })))
    } as unknown as AuthService;

    locationMock = {} as unknown as Location;
    dialogMock = {
      open: jasmine.createSpy('open')
      .and.returnValue({
        close: jasmine.createSpy('close')
      })
    } as unknown as MatDialog;

    component = new Login(new FormBuilder(), authMock, routerMock, locationMock, dialogMock);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call auth.login and navigate on valid submit', async () => {
    spyOn(window.localStorage, 'setItem');
    component.form.setValue({ Correo: 'test@mail.com', Contrasena: '12345678' });
    component.doOnSubmit();
    expect(authMock.login as unknown as jasmine.Spy).toHaveBeenCalledOnceWith({
      email: 'test@mail.com',
      password: '12345678'
    });
    await Promise.resolve();
    expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'Bearer1234');
    expect(routerMock.navigate as unknown as jasmine.Spy).toHaveBeenCalledWith(['/home-page']);
  });

  it('should not call auth.login if form is invalid', () => {
    (authMock.login as unknown as jasmine.Spy).calls.reset();
    component.form.setValue({ Correo: '', Contrasena: '' });
    component.doOnSubmit();
    expect(authMock.login as unknown as jasmine.Spy).not.toHaveBeenCalled();
  });
});

