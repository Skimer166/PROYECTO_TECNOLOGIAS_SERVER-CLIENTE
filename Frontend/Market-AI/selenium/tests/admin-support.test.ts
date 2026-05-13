import { By, until, WebDriver } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import { TIMEOUT, NAV_TIMEOUT } from '../helpers';

const BASE_URL = 'https://proyectoservidorcliente.vercel.app';
const PAUSE = 1000;

describe('Market-AI — Chats de Soporte', () => {
  let driver: WebDriver;
  let tabAdmin: string;
  let tabUser: string;

  beforeAll(async () => {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const { driver: d, browserUsed } = await createDriver();
        driver = d;
        console.log(`Navegador detectado: ${browserUsed} (intento ${i + 1})`);
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠ Intento ${i + 1} falló: ${lastError.message}`);
        console.warn(`Stack: ${lastError.stack}`);
        if (i < maxRetries - 1) await new Promise(r => setTimeout(r, 3000));
      }
    }

    const errorMsg =
      `WebDriver no pudo iniciarse tras ${maxRetries} intentos.\n` +
      `Último error: ${lastError?.message}\n` +
      `Verifica que el navegador y WebDriver están disponibles en el ambiente CI.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }, 120000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ── Landing Page ────────────────────────────────────────────────────────────

  it('Debe abrir la landing page correctamente', async () => {
    await driver.get(`${BASE_URL}/landing-page`);
    await driver.wait(until.titleContains('Market'), TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/landing-page');
  });

  it('Debe mostrar el título principal', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"El marketplace donde encuentras")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el botón "Ingresar"', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")] | //a[contains(.,"Ingresar")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btn.isDisplayed()).toBe(true);
  });

  // ── Login Admin ─────────────────────────────────────────────────────────────

  it('Debe navegar a la página de login al presionar "Ingresar"', async () => {
    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Ingresar")]')),
      TIMEOUT
    );
    await btn.click();
    await driver.wait(until.urlContains('/login'), TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/login');
  });

  it('Debe verificar que la página de login se muestra correctamente', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Inicia sesion en Market AI")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);

    const inputCorreo = await driver.wait(
      until.elementLocated(By.css('input[name="Correo"]')),
      TIMEOUT
    );
    expect(await inputCorreo.isDisplayed()).toBe(true);

    const inputContrasena = await driver.wait(
      until.elementLocated(By.css('input[name="Contrasena"]')),
      TIMEOUT
    );
    expect(await inputContrasena.isDisplayed()).toBe(true);
  });

  it('Debe llenar el formulario de login y presionar Enviar', async () => {
    const inputCorreo = await driver.wait(
      until.elementLocated(By.css('input[name="Correo"]')),
      TIMEOUT
    );
    await inputCorreo.clear();
    await inputCorreo.sendKeys('ianrdzwong@gmail.com');

    const inputContrasena = await driver.wait(
      until.elementLocated(By.css('input[name="Contrasena"]')),
      TIMEOUT
    );
    await inputContrasena.clear();
    await inputContrasena.sendKeys('123456789');
    await driver.sleep(PAUSE);

    const btnEnviar = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Enviar")]')),
      TIMEOUT
    );
    await btnEnviar.click();
    await driver.sleep(PAUSE);
  });

  // ── Home Page Admin ─────────────────────────────────────────────────────────

  it('Debe estar en el home-page después de iniciar sesión', async () => {
    await driver.wait(until.urlContains('/home-page'), NAV_TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/home-page');

    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Bienvenido a Market-AI")]')),
      TIMEOUT
    );
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el panel de administración con sus botones', async () => {
    const panel = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Panel de administración")]')),
      TIMEOUT
    );
    expect(await panel.isDisplayed()).toBe(true);

    const btnSoporte = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Chats de Soporte")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btnSoporte.isDisplayed()).toBe(true);
  });

  // ── Panel de Soporte (Admin) ─────────────────────────────────────────────────

  it('Debe navegar a Chats de Soporte al presionar el botón correspondiente', async () => {
    const overlays = await driver.findElements(By.css('.cdk-overlay-backdrop-showing'));
    for (const overlay of overlays) {
      try { await driver.executeScript('arguments[0].click()', overlay); } catch (e) { console.warn('overlay click failed', e); }
    }
    if (overlays.length > 0) await driver.sleep(500);

    const btn = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Chats de Soporte")]')),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btn);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btn);
    await driver.wait(until.urlContains('/admin/support'), TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/admin/support');
  });

  it('Debe mostrar el título "Chats Activos"', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(.,"Chats Activos")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el mensaje de sin solicitudes o la lista de chats', async () => {
    await driver.sleep(PAUSE);
    const contenido = await driver.wait(
      until.elementLocated(
        By.xpath('//*[contains(.,"No hay solicitudes de soporte")] | //mat-list-item')
      ),
      TIMEOUT
    );
    expect(await contenido.isDisplayed()).toBe(true);

    // Guardar handle de la pestaña admin
    tabAdmin = await driver.getWindowHandle();
  });

  // ── Nueva Pestaña — Cerrar sesión admin y login como kikeruv ────────────────

  it('Debe abrir una nueva pestaña y cerrar la sesión del admin', async () => {
    await driver.executeScript('window.open()');
    const handles = await driver.getAllWindowHandles();
    tabUser = handles.at(-1)!;
    await driver.switchTo().window(tabUser);

    // La nueva pestaña comparte localStorage → admin sigue logueado
    await driver.get(`${BASE_URL}/home-page`);
    await driver.sleep(2000); // Esperar que Angular inicialice

    const btnSalir = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(@class,"logout-btn")]')),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].click()', btnSalir);
    await driver.sleep(PAUSE);

    const url = await driver.getCurrentUrl();
    expect(url).not.toContain('/home-page');
  });

  it('Debe iniciar sesión como kikeruv en la nueva pestaña', async () => {
    // Navegar directo a /login (landing-page oculta "Ingresar" si hay sesión activa)
    await driver.get(`${BASE_URL}/login`);
    await driver.wait(until.urlContains('/login'), TIMEOUT);

    const inputCorreo = await driver.wait(
      until.elementLocated(By.css('input[name="Correo"]')),
      TIMEOUT
    );
    await inputCorreo.clear();
    await inputCorreo.sendKeys('kikeruv2004@gmail.com');

    const inputContrasena = await driver.wait(
      until.elementLocated(By.css('input[name="Contrasena"]')),
      TIMEOUT
    );
    await inputContrasena.clear();
    await inputContrasena.sendKeys('1234567890');
    await driver.sleep(PAUSE);

    const btnEnviar = await driver.wait(
      until.elementLocated(By.xpath('//button[contains(.,"Enviar")]')),
      TIMEOUT
    );
    await btnEnviar.click();

    await driver.wait(until.urlContains('/home-page'), NAV_TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/home-page');
  });

  // ── Widget de Soporte (Usuario) ─────────────────────────────────────────────

  it('Debe mostrar el botón flotante de soporte', async () => {
    const fab = await driver.wait(
      until.elementLocated(By.css('button.support-fab')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await fab.isDisplayed()).toBe(true);
  });

  it('Debe abrir el chat de soporte al presionar el botón flotante', async () => {
    const fab = await driver.wait(
      until.elementLocated(By.css('button.support-fab')),
      TIMEOUT
    );
    await fab.click();
    await driver.sleep(PAUSE);

    const ventanaChat = await driver.wait(
      until.elementLocated(By.css('.support-chat-window')),
      TIMEOUT
    );
    expect(await ventanaChat.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el título "Soporte Técnico" en el chat', async () => {
    const titulo = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(@class,"chat-header")]//*[contains(.,"Soporte Técnico")]')),
      TIMEOUT
    );
    expect(await titulo.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el campo de texto y el botón de enviar', async () => {
    const input = await driver.wait(
      until.elementLocated(By.xpath('//input[@placeholder="Escribe tu duda..."]')),
      TIMEOUT
    );
    expect(await input.isDisplayed()).toBe(true);

    const btnEnviar = await driver.wait(
      until.elementLocated(By.css('.chat-footer button[mat-mini-fab]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btnEnviar.isDisplayed()).toBe(true);
  });

  it('Debe enviar un mensaje de soporte', async () => {
    const input = await driver.wait(
      until.elementLocated(By.xpath('//input[@placeholder="Escribe tu duda..."]')),
      TIMEOUT
    );
    await input.clear();
    await input.sendKeys('Hola, necesito ayuda con mi cuenta - Selenium Test');
    await driver.sleep(500);

    const btnEnviar = await driver.wait(
      until.elementLocated(By.css('.chat-footer button[mat-mini-fab]')),
      TIMEOUT
    );
    await btnEnviar.click();
    await driver.sleep(PAUSE * 2);

    const mensaje = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(@class,"bubble")]//*[contains(.,"Hola, necesito ayuda")]')),
      TIMEOUT
    );
    expect(await mensaje.isDisplayed()).toBe(true);
  });

  // ── Volver a Pestaña Admin — Verificar sesión de kikeruv ────────────────────

  it('Debe mostrar la sesión de Enrique en el panel de soporte del admin', async () => {
    await driver.switchTo().window(tabAdmin);
    await driver.sleep(PAUSE * 5);

    try {
      const sesion = await driver.wait(
        until.elementLocated(By.xpath('//mat-list-item[.//*[contains(.,"Enrique")]]')),
        30000
      );
      expect(await sesion.isDisplayed()).toBe(true);
    } catch {
      await driver.navigate().refresh();
      await driver.sleep(PAUSE * 2);
      const sesion = await driver.wait(
        until.elementLocated(By.xpath('//mat-list-item[.//*[contains(.,"Enrique")]]')),
        30000
      );
      expect(await sesion.isDisplayed()).toBe(true);
    }
  }, 90_000);

  it('Debe seleccionar la sesión de Enrique y abrir el chat', async () => {
    const sesion = await driver.wait(
      until.elementLocated(By.xpath('//mat-list-item[.//*[contains(.,"Enrique")]]')),
      TIMEOUT
    );
    await sesion.click();
    await driver.sleep(PAUSE);

    const chatHeader = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(@class,"chat-header")][contains(.,"Enrique")]')),
      TIMEOUT
    );
    expect(await chatHeader.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el mensaje enviado por kikeruv en el chat del admin', async () => {
    const mensaje = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(@class,"messages")]//*[contains(.,"Hola, necesito ayuda")]')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await mensaje.isDisplayed()).toBe(true);
  });

  it('Debe mostrar el campo de respuesta del admin y el botón "Enviar"', async () => {
    const inputRespuesta = await driver.wait(
      until.elementLocated(By.xpath('//input[@placeholder="Escribe una respuesta..."]')),
      TIMEOUT
    );
    expect(await inputRespuesta.isDisplayed()).toBe(true);

    const btnEnviar = await driver.wait(
      until.elementLocated(By.css('.input-area button')),
      TIMEOUT
    );
    await driver.sleep(PAUSE);
    expect(await btnEnviar.isDisplayed()).toBe(true);
  });

  it('Debe enviar una respuesta al usuario desde el panel de admin', async () => {
    const inputRespuesta = await driver.wait(
      until.elementLocated(By.xpath('//input[@placeholder="Escribe una respuesta..."]')),
      TIMEOUT
    );
    await inputRespuesta.clear();
    await inputRespuesta.sendKeys('Hola kikeruv, estamos revisando tu caso - Admin Selenium');
    await driver.sleep(1000);

    const btnEnviar = await driver.wait(
      until.elementLocated(By.css('.input-area button')),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btnEnviar);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btnEnviar);
    await driver.sleep(PAUSE * 2);

    const respuesta = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(@class,"messages")]//*[contains(.,"Hola kikeruv, estamos revisando")]')),
      TIMEOUT
    );
    expect(await respuesta.isDisplayed()).toBe(true);
  }, 90_000);

  // ── Volver a Pestaña Usuario — Verificar respuesta del admin ────────────────

  it('Debe mostrar la respuesta del admin en el chat del usuario', async () => {
    await driver.switchTo().window(tabUser);
    await driver.sleep(PAUSE * 3);

    const respuesta = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(@class,"bubble")]//*[contains(.,"Hola kikeruv, estamos revisando")]')),
      TIMEOUT
    );
    expect(await respuesta.isDisplayed()).toBe(true);
  });

  it('Debe cerrar el chat de soporte del usuario', async () => {
    const btnCerrar = await driver.wait(
      until.elementLocated(By.xpath('//*[contains(@class,"chat-header")]//button[@mat-icon-button]')),
      TIMEOUT
    );
    await btnCerrar.click();
    await driver.sleep(PAUSE);

    const ventanas = await driver.findElements(By.css('.support-chat-window'));
    expect(ventanas.length).toBe(0);
  });

  // ── Regresar al Home desde Admin ────────────────────────────────────────────

  it('Debe regresar al home-page desde Chats de Soporte', async () => {
    await driver.switchTo().window(tabAdmin);

    const btnBack = await driver.wait(
      until.elementLocated(By.css('button[mat-icon-button][routerlink="/home-page"]')),
      TIMEOUT
    );
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"})', btnBack);
    await driver.sleep(300);
    await driver.executeScript('arguments[0].click()', btnBack);
    await driver.wait(until.urlContains('/home-page'), TIMEOUT);
    await driver.sleep(PAUSE);
    expect(await driver.getCurrentUrl()).toContain('/home-page');
  });
});