import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportWidget } from './support-widget';

describe('SupportWidget', () => {
  let component: SupportWidget;
  let fixture: ComponentFixture<SupportWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
