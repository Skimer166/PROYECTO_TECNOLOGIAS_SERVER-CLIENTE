import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as chromedriver from 'chromedriver';

const BASE_URL = 'https://proyectoservidorcliente.vercel.app';
const PAUSE = 1000;

describe('Market-AI — Chats de Soporte', () => {
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

  // ── Landing Page ────────────────────────────────────────────────────────────

  it('Debe abrir la landing page correctamente', async () => {
    await driver.get(`${BASE_URL}/landing-page`);
    await driver.wait(until.titleContains('Market'), 10000);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/landing-page');
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
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")] | //a[contains(.,"Ingresar")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await btn.isDisplayed()).toBe(true);
  });

  // ── Login ───────────────────────────────────────────────────────────────────

  it('Debe navegar a la página de login al presionar "Ingresar"', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")]')),
      10000
    );
    await btn.click();
    await driver.wait(until.urlContains('/login'), 10000);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/login');
  });

  it('Debe verificar que la página de login se muestra correctamente', async () => {
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

  // ── Home Page ───────────────────────────────────────────────────────────────

  it('Debe estar en el home-page después de iniciar sesión', async () => {
    await driver.wait(until.urlContains('/home-page'), 15000);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/home-page');

    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Bienvenido a Market-AI")]')),
      10000
    );
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el panel de administración con sus botones', async () => {
    const panel = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Panel de administración")]')),
      10000
    );
    expect(await panel.isDisplayed()).toBe(true);

    const btnSoporte = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Chats de Soporte")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await btnSoporte.isDisplayed()).toBe(true);
  });

  // ── Chats de Soporte ────────────────────────────────────────────────────────

  it('Debe navegar a Chats de Soporte al presionar el botón correspondiente', async () => {
    const overlays = await driver.findElements(By.css('.cdk-overlay-backdrop-showing'));
    for (const overlay of overlays) {
      try { await driver.executeScript('arguments[0].click()', overlay); } catch (_) {}
    }
    if (overlays.length > 0) await driver.sleep(500);

    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Chats de Soporte")]')),
      10000
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btn);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btn);
    await driver.wait(until.urlContains('/admin/support'), 10000);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/admin/support');
  });

  it('Debe mostrar el título "Chats Activos"', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Chats Activos")]')),
      10000
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el mensaje de no hay solicitudes o la lista de chats', async () => {
    await driver.sleep(PAUSE);
    const contenido = await driver.wait(
      until.elementLocated(
        By.xpath('//*[contains(.,"No hay solicitudes de soporte")] | //mat-list-item')
      ),
      10000
    );
    expect(await contenido.isDisplayed()).toBe(true);
  });

  // ── Regresar ────────────────────────────────────────────────────────────────

  it('Debe regresar al home-page desde Chats de Soporte', async () => {
    const btnBack = await driver.wait(
      until.elementLocated(By.css('button[mat-icon-button][routerlink="/home-page"]')),
      10000
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btnBack);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btnBack);
    await driver.wait(until.urlContains('/home-page'), 10000);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/home-page');
  });
});
