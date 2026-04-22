import { By, until, WebDriver } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';

const BASE_URL = 'http://localhost:4200';
const BACKEND_URL = process.env['BACKEND_URL'] ?? 'https://market-ai-api.onrender.com';
const TIMEOUT = 10000;

describe('Módulo de Autenticación - E2E', () => {
  let driver: WebDriver | undefined;
  let backendAvailable = false;

  beforeAll(async () => {
    // Verificar si el backend está disponible (timeout 5s)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(`${BACKEND_URL}/auth/login`, { signal: controller.signal });
      clearTimeout(timeoutId);
      backendAvailable = true;
    } catch {
      backendAvailable = false;
    }

    if (!backendAvailable) {
      console.warn(`\nBackend no disponible en ${BACKEND_URL}.`);
      console.warn('   Las pruebas que requieren backend seran omitidas.\n');
    } else {
      console.log(`\nBackend disponible en ${BACKEND_URL}\n`);
    }

    // Detectar y usar el primer navegador disponible
    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`Navegador detectado: ${browserUsed}\n`);
  }, 60000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // PRUEBA 1: Requiere backend — se omite si no está disponible
  it('Debe mostrar error con credenciales incorrectas', async () => {
    if (!backendAvailable) {
      console.warn('  Prueba omitida: backend no disponible.');
      return;
    }

    await driver!.get(`${BASE_URL}/login`);

    await driver!.findElement(By.css('input[formControlName="Correo"]'))
      .sendKeys('rubenfalso@gmail.com');
    await driver!.findElement(By.css('input[formControlName="Contrasena"]'))
      .sendKeys('contraseñaincorrecta');
    await driver!.findElement(By.xpath('//button[contains(.,"Enviar")]'))
      .click();

    const errorMsg = await driver!.wait(
      until.elementLocated(By.xpath('//*[contains(text(),"Credenciales invalidas")]')),
      TIMEOUT
    );
    expect(await errorMsg.isDisplayed()).toBe(true);
  });

  // PRUEBA 2: Solo frontend — no requiere backend
  it('No debe permitir enviar el formulario con campos vacíos', async () => {
    await driver!.get(`${BASE_URL}/login`);

    const submitButton = await driver!.findElement(
      By.xpath('//button[contains(.,"Enviar")]')
    );
    expect(await submitButton.isEnabled()).toBe(false);
  });

  // PRUEBA 3: Solo frontend — no requiere backend
  it('Debe deshabilitar el botón si las contraseñas no coinciden', async () => {
    await driver!.get(`${BASE_URL}/register`);

    await driver!.findElement(By.css('input[formControlName="Nombre"]'))
      .sendKeys('Usuario Test');
    await driver!.findElement(By.css('input[formControlName="Correo"]'))
      .sendKeys('nuevo@gmail.com');
    await driver!.findElement(By.css('input[formControlName="Contraseña"]'))
      .sendKeys('12345678');
    await driver!.findElement(By.css('input[formControlName="Confirmar_contraseña"]'))
      .sendKeys('00000000');

    const checkbox = await driver!.findElement(By.css('mat-checkbox'));
    await checkbox.click();

    const submitButton = await driver!.findElement(
      By.xpath('//button[contains(.,"Enviar")]')
    );
    expect(await submitButton.isEnabled()).toBe(false);
  });
});
