
describe('Módulo de Autenticación', () => {

  // PRUEBA 1: Login Fallido
  it('Debe mostrar error con credenciales incorrectas', () => {
    cy.visit('/login');
    cy.get('input[formControlName="Correo"]').type('rubenfalso@gmail.com');
    cy.get('input[formControlName="Contrasena"]').type('contraseñaincorrecta');
    cy.get('button').contains('Enviar').click();

    cy.contains('Credenciales invalidas o error de conexion').should('be.visible'); 
  });

  // PRUEBA 2: Login Exitoso
  it('Debe redirigir al Home Page con credenciales correctas', () => {
    // solo simulo una respuesta falsa pero exitosa del backend
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: { token: 'fake-jwt-token-123' }
    }).as('loginExitoso');

    cy.visit('/login');
    cy.get('input[formControlName="Correo"]').type('admin@gmail.com');
    cy.get('input[formControlName="Contrasena"]').type('12345678');
    cy.get('button').contains('Enviar').click();

    cy.wait('@loginExitoso');
    cy.url().should('include', '/home-page');
  });

  // PRUEBA 3: Validación Registro
  it('Debe validar coincidencia de contraseñas en el registro', () => {
    cy.visit('/register');
    cy.get('input[formControlName="Nombre"]').type('Usuario Nuevo');
    cy.get('input[formControlName="Correo"]').type('nuevo@gmail.com');
    cy.get('input[formControlName="Contraseña"]').type('12345678');
    
    // aqui no coinciden las contraseñas deberia dar error
    cy.get('input[formControlName="Confirmar_contraseña"]').type('00000000');
    
    cy.get('mat-checkbox').click();
    
    // el boton esta disabled, no deberia poder clickearlo
    cy.contains('button', 'Enviar').should('be.disabled');
  });

});