import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AuthService (Unitarias)', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('Prueba Unitaria 3: El servicio debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('Prueba Unitaria Extra: getToken debe retornar null si no hay sesión', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(sessionStorage, 'getItem').and.returnValue(null);
    expect(service.getToken()).toBeNull();
  });
});