import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginSuccess } from './login-success';
import { provideRouter } from '@angular/router'; // Importar router
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('LoginSuccess', () => {
  let component: LoginSuccess;
  let fixture: ComponentFixture<LoginSuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginSuccess],
      providers: [
        provideRouter([]), 
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginSuccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});