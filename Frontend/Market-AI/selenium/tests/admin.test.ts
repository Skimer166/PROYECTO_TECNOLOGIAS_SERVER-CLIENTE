import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as chromedriver from 'chromedriver';

const BASE_URL = 'https://proyectoservidorcliente.vercel.app';
const PAUSE = 2000;

describe('Market-AI — Landing Page', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const service = new chrome.ServiceBuilder(chromedriver.path);
    const options = new chrome.Options();
    options.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--start-maximized');
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeService(service)
      .setChromeOptions(options)
      .build();
  }, 60000);

  afterAll(async () => {
    await driver.sleep(PAUSE);
    if (driver) await driver.quit();
  });

  it('Debe abrir la landing page correctamente', async () => {
    await driver.get(`${BASE_URL}/landing-page`);
    await driver.wait(until.titleContains('Market'), 10000);
    await driver.sleep(PAUSE);
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/landing-page');
  });

  it('Debe mostrar el título principal', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"El marketplace donde encuentras")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el botón "Ingresar"', async () => {
    const btnIngresar = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")] | //a[contains(.,"Ingresar")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await btnIngresar.isDisplayed()).toBe(true);
  });

  it('Debe navegar a la página de login al presionar "Ingresar"', async () => {
    const btnIngresar = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")]')),
      10000
    );
    await driver.sleep(PAUSE);
    await btnIngresar.click();
    await driver.wait(until.urlContains('/login'), 10000);
    await driver.sleep(PAUSE);
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/login');
  });

  it('Debe verificar que la página de login se muestra correctamente', async () => {
    const url = await driver.getCurrentUrl();
    expect(url).toContain('/login');

    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Inicia sesion en Market AI")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);

    const inputCorreo = await driver.wait(
      until.elementLocated(By.css('input[name="Correo"]')),
      10000
    );
    expect(await inputCorreo.isDisplayed()).toBe(true);

    const inputContrasena = await driver.wait(
      until.elementLocated(By.css('input[name="Contrasena"]')),
      10000
    );
    expect(await inputContrasena.isDisplayed()).toBe(true);
  });

  it('Debe llenar el formulario de login y presionar Enviar', async () => {
    const inputCorreo = await driver.wait(
      until.elementLocated(By.css('input[name="Correo"]')),
      10000
    );
    await driver.sleep(PAUSE);
    await inputCorreo.clear();
    await inputCorreo.sendKeys('ianrdzwong@gmail.com');

    const inputContrasena = await driver.wait(
      until.elementLocated(By.css('input[name="Contrasena"]')),
      10000
    );
    await inputContrasena.clear();
    await inputContrasena.sendKeys('123456789');
    await driver.sleep(PAUSE);

    const btnEnviar = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Enviar")]')),
      10000
    );
    await btnEnviar.click();
    await driver.sleep(PAUSE);
  });

  it('Debe estar en el home-page después de iniciar sesión', async () => {
    await driver.wait(until.urlContains('/home-page'), 15000);
    await driver.sleep(PAUSE);

    const url = await driver.getCurrentUrl();
    expect(url).toContain('/home-page');

    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Bienvenido a Market-AI")]')),
      10000
    );
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el panel de administración', async () => {
    const panelTitulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Panel de administración")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await panelTitulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el botón "Panel de agentes"', async () => {
    const btnAgentes = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Panel de agentes")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await btnAgentes.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el botón "Panel de usuarios"', async () => {
    const btnUsuarios = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Panel de usuarios")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await btnUsuarios.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el botón "Chats de Soporte"', async () => {
    const btnSoporte = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Chats de Soporte")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await btnSoporte.isDisplayed()).toBe(true);
  });
});
