import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomePage } from './home-page';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
// CAMBIO: Importar desde .../animations/async
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute } from '@angular/router';

describe('HomePage (Unitarias)', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        // Reemplazo aquí
        provideAnimationsAsync(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    
    // Mock de datos
    component.agents = [
      { _id: '1', name: 'Agente Python', description: 'Code', category: 'programacion', language: 'es', modelVersion: 'v1', pricePerHour: 10, availability: true },
      { _id: '2', name: 'Agente Cocina', description: 'Food', category: 'otros', language: 'es', modelVersion: 'v1', pricePerHour: 10, availability: true }
    ];
    
    fixture.detectChanges();
  });

  it('Prueba Unitaria 5: Filtro de búsqueda', () => {
    component.onSearchTermChange('Python');
    expect(component.filteredAgents.length).toBe(1);
    expect(component.filteredAgents[0].name).toBe('Agente Python');
  });
});