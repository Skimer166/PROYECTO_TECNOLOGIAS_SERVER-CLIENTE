import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSupport } from './admin-support';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AdminSupport', () => {
  let component: AdminSupport;
  let fixture: ComponentFixture<AdminSupport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSupport],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSupport);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});