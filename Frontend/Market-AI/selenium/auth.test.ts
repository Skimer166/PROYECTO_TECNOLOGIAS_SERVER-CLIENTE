import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

const BASE_URL = 'http://localhost:4200';
const TIMEOUT = 10000;

describe('Módulo de Autenticación - E2E', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const options = new Options();
    options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  afterAll(async () => {
    await driver.quit();
  });

  // PRUEBA 1: Login fallido con credenciales incorrectas
  it('Debe mostrar error con credenciales incorrectas', async () => {
    await driver.get(`${BASE_URL}/login`);

    await driver.findElement(By.css('input[formControlName="Correo"]'))
      .sendKeys('rubenfalso@gmail.com');
    await driver.findElement(By.css('input[formControlName="Contrasena"]'))
      .sendKeys('contraseñaincorrecta');
    await driver.findElement(By.xpath('//button[contains(text(),"Enviar")]'))
      .click();

    const errorMsg = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(text(),"Credenciales invalidas")]')),
      TIMEOUT
    );
    expect(await errorMsg.isDisplayed()).toBe(true);
  });

  // PRUEBA 2: El botón Enviar está deshabilitado con campos vacíos
  it('No debe permitir enviar el formulario con campos vacíos', async () => {
    await driver.get(`${BASE_URL}/login`);

    const submitButton = await driver.findElement(
      By.xpath('//button[contains(text(),"Enviar")]')
    );
    expect(await submitButton.isEnabled()).toBe(false);
  });

  // PRUEBA 3: Validación de contraseñas en registro
  it('Debe deshabilitar el botón si las contraseñas no coinciden', async () => {
    await driver.get(`${BASE_URL}/register`);

    await driver.findElement(By.css('input[formControlName="Nombre"]'))
      .sendKeys('Usuario Test');
    await driver.findElement(By.css('input[formControlName="Correo"]'))
      .sendKeys('nuevo@gmail.com');
    await driver.findElement(By.css('input[formControlName="Contraseña"]'))
      .sendKeys('12345678');
    await driver.findElement(By.css('input[formControlName="Confirmar_contraseña"]'))
      .sendKeys('00000000');

    const checkbox = await driver.findElement(By.css('mat-checkbox'));
    await checkbox.click();

    const submitButton = await driver.findElement(
      By.xpath('//button[contains(text(),"Enviar")]')
    );
    expect(await submitButton.isEnabled()).toBe(false);
  });
});
