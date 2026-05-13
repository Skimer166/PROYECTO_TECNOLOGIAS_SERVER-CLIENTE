import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationDialogComponent } from './popup-login';

describe('ND — Notification Dialog', () => {
  let component: NotificationDialogComponent;
  let fixture: ComponentFixture<NotificationDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<NotificationDialogComponent>>;

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [NotificationDialogComponent],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            message: 'Operación exitosa',
            type: 'success',
          },
        },
        {
          provide: MatDialogRef,
          useValue: dialogRefSpy,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('ND-01: muestra mensaje correctamente', () => {
    expect(component).toBeTruthy();

    const title = fixture.nativeElement.querySelector('.notify-title');

    expect(title.textContent).toContain('Operación exitosa');
  });

  it('ND-02: botón cerrar ejecuta dialogRef.close()', () => {
    component.close();

    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('ND-03: renderiza botón cerrar', () => {
    const button = fixture.nativeElement.querySelector('button');

    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Cerrar');
  });
});
