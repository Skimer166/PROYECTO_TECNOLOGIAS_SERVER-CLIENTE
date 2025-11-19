import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSuccess } from './login-success';

describe('LoginSuccess', () => {
  let component: LoginSuccess;
  let fixture: ComponentFixture<LoginSuccess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginSuccess]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginSuccess);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
