import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RentDialog } from './rent-dialog';

describe('RentDialog', () => {
  let component: RentDialog;
  let fixture: ComponentFixture<RentDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RentDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RentDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
