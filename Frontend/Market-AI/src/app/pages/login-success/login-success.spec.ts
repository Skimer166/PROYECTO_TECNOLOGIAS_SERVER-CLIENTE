import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginSuccess } from './login-success';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../shared/services/auth';
import { MatDialog } from '@angular/material/dialog';

describe('LS — Login Success Page', () => {
  let fixture: ComponentFixture<LoginSuccess>;
  let authMock: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  function createComponent(token: string | null) {
    TestBed.configureTestingModule({
      imports: [LoginSuccess],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap(token ? { token } : {})),
          },
        },
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
      ],
    });

    fixture = TestBed.createComponent(LoginSuccess);
  }

  beforeEach(() => {
    authMock = jasmine.createSpyObj('AuthService', ['setTokenFromOAuth']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({
      close: jasmine.createSpy('close'),
    } as unknown as ReturnType<MatDialog['open']>);
  });

  it('LS-01: procesa token OAuth y navega al home', fakeAsync(() => {
    createComponent('jwt-token');

    fixture.detectChanges();
    tick();

    expect(authMock.setTokenFromOAuth).toHaveBeenCalledWith('jwt-token');
    expect(dialogSpy.open).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home-page']);
  }));

  it('LS-02: sin token navega a /login', fakeAsync(() => {
    createComponent(null);

    fixture.detectChanges();
    tick();

    expect(authMock.setTokenFromOAuth).not.toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { error: 'missing_token' },
    });
  }));

  it('LS-03: abre dialog de éxito', fakeAsync(() => {
    createComponent('valid-token');

    fixture.detectChanges();
    tick();

    expect(dialogSpy.open).toHaveBeenCalled();

    const args = dialogSpy.open.calls.mostRecent().args[1] as {
      data: {
        type: string;
      };
    };

    expect(args.data.type).toBe('success');
  }));

});