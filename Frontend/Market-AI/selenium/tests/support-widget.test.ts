// Tests E2E - Support Widget (SW-01 a SW-22)
import { WebDriver, By } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  APP_URL,
  FAKE_USER_TOKEN,
  setToken,
  clearToken,
  waitVisible,
  sleep,
} from '../helpers';

describe('Support Widget (E2E)', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`Navegador detectado: ${browserUsed}\n`);

    await driver.get(APP_URL + '/landing-page');
    await clearToken(driver);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // Helper: navega a landing-page con sesion activa y espera el boton flotante de accion (FAB)
  async function goToPageWithSession(): Promise<void> {
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/landing-page');
    await sleep(2000);
  }

  // Helper: abre la ventana de chat (asume sesion activa y boton flotante de accion (FAB) visible)
  async function openChat(): Promise<void> {
    await goToPageWithSession();
    const fab = await waitVisible(driver, By.css('.support-fab'));
    await fab.click();
    await sleep(500);
    await waitVisible(driver, By.css('.support-chat-window'));
  }

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 1: boton flotante de accion (FAB) no visible sin sesion activa - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe ocultar el FAB de soporte cuando no hay sesion activa', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await sleep(2000);

    const fabs = await driver.findElements(By.css('.support-fab'));
    expect(fabs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 2: boton flotante de accion (FAB) visible cuando hay sesion activa - no requiere backend
  // El widget usa isLoggedIn$ del AuthService para mostrar el boton
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el FAB de soporte cuando hay sesion activa', async () => {
    await goToPageWithSession();

    const fab = await waitVisible(driver, By.css('.support-fab'));
    expect(await fab.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 3: Click en boton flotante de accion (FAB) abre la ventana de chat - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir la ventana de chat al hacer clic en el FAB', async () => {
    await goToPageWithSession();

    const fab = await waitVisible(driver, By.css('.support-fab'));
    await fab.click();
    await sleep(500);

    const chatWindow = await waitVisible(driver, By.css('.support-chat-window'));
    expect(await chatWindow.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 4: La ventana de chat muestra el encabezado correcto - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el encabezado "Soporte Tecnico" en la ventana de chat', async () => {
    await openChat();

    const header = await driver.findElement(By.css('.chat-header'));
    const headerText = await header.getText();
    expect(headerText).toContain('Soporte');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 5: Boton cerrar oculta la ventana de chat - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar la ventana de chat al hacer clic en el boton X', async () => {
    await openChat();

    const closeBtn = await driver.findElement(By.css('.chat-header button'));
    await closeBtn.click();
    await sleep(500);

    const chatWindows = await driver.findElements(By.css('.support-chat-window'));
    expect(chatWindows.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 6: El input del chat acepta texto - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe aceptar texto en el input del chat', async () => {
    await openChat();

    const chatInput = await waitVisible(driver, By.css('.chat-footer input'));
    await chatInput.sendKeys('Hola prueba');
    await sleep(300);

    const inputValue = await chatInput.getAttribute('value');
    expect(inputValue).toBe('Hola prueba');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 7: Boton enviar deshabilitado cuando el input esta vacio - no requiere backend
  // El boton usa [disabled]="!newMessage.trim()"
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton de enviar deshabilitado cuando el input esta vacio', async () => {
    await openChat();

    const sendBtn = await driver.findElement(By.css('.chat-footer button'));
    expect(await sendBtn.getAttribute('disabled')).not.toBeNull();
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 8: Mensaje enviado aparece en el cuerpo del chat - no requiere backend
  // El mensaje se inserta localmente en this.messages antes de enviarlo por socket
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el mensaje enviado en el cuerpo del chat', async () => {
    await openChat();

    const testMsg = 'Mensaje de prueba E2E ' + Date.now();
    const chatInput = await waitVisible(driver, By.css('.chat-footer input'));
    await chatInput.sendKeys(testMsg);
    await sleep(300);

    const sendBtn = await driver.findElement(By.css('.chat-footer button'));
    await sendBtn.click();
    await sleep(500);

    // El mensaje se agrega localmente a this.messages → aparece en .chat-body
    const bubbles = await driver.findElements(By.css('.chat-body .bubble p'));
    expect(bubbles.length).toBeGreaterThan(0);

    const lastBubble = bubbles[bubbles.length - 1];
    expect(await lastBubble.getText()).toBe(testMsg);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 9: El boton flotante de accion (FAB) tiene posicion fixed - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el FAB con posicion fixed en su estilo computado', async () => {
    await goToPageWithSession();

    const fab = await waitVisible(driver, By.css('.support-fab'));
    const position = await driver.executeScript(
      `return window.getComputedStyle(arguments[0]).position`, fab
    ) as string;
    expect(position).toBe('fixed');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 10: El boton flotante de accion (FAB) tiene un icono visible - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el FAB con un icono visible', async () => {
    await goToPageWithSession();
    await waitVisible(driver, By.css('.support-fab'));

    const icons = await driver.findElements(By.css('.support-fab mat-icon, .support-fab svg, .support-fab img'));
    expect(icons.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 11: El panel de chat tiene un campo de texto - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener un input o textarea para escribir mensajes en el panel de chat', async () => {
    await openChat();

    const inputs = await driver.findElements(By.css('.support-chat-window input, .support-chat-window textarea'));
    expect(inputs.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 12: El panel de chat tiene un boton de enviar - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener un boton de enviar visible en el panel de chat', async () => {
    await openChat();

    const sendBtn = await driver.findElement(By.css('.chat-footer button'));
    expect(await sendBtn.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 13: El boton enviar deshabilitado con input vacio - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton de enviar deshabilitado cuando el input esta vacio al abrir el chat', async () => {
    await openChat();

    const chatInput = await waitVisible(driver, By.css('.chat-footer input'));
    const value = await chatInput.getAttribute('value');
    if (!value || value.trim().length === 0) {
      const sendBtn = await driver.findElement(By.css('.chat-footer button'));
      expect(await sendBtn.getAttribute('disabled')).not.toBeNull();
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 14: El input del chat tiene placeholder - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el input del chat con placeholder no vacio', async () => {
    await openChat();

    const chatInput = await waitVisible(driver, By.css('.chat-footer input'));
    const placeholder = await chatInput.getAttribute('placeholder');
    expect(placeholder && placeholder.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 15: El panel tiene area de historial de mensajes - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener un contenedor de historial de mensajes en el panel de chat', async () => {
    await openChat();

    const body = await driver.findElement(By.css('.chat-body'));
    expect(await body.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 16: El boton flotante de accion (FAB) es accesible por teclado - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el FAB accesible por teclado como elemento nativo button o con tabindex', async () => {
    await goToPageWithSession();

    const fab = await waitVisible(driver, By.css('.support-fab'));
    const tag = await fab.getTagName();
    const tabindex = await fab.getAttribute('tabindex');

    const isAccessible = tag === 'button' || (tabindex !== null && parseInt(tabindex) >= 0);
    expect(isAccessible).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 17: El panel tiene un header o titulo visible - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener un header visible con texto en el panel de chat', async () => {
    await openChat();

    const header = await driver.findElement(By.css('.chat-header'));
    const text = await header.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 18: El input acepta texto con multiples palabras - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe aceptar texto con multiples palabras en el input del chat', async () => {
    await openChat();

    const chatInput = await waitVisible(driver, By.css('.chat-footer input'));
    await chatInput.clear();
    await chatInput.sendKeys('Hola necesito ayuda');
    await sleep(300);

    const value = await chatInput.getAttribute('value');
    expect(value).toBe('Hola necesito ayuda');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 19: Abrir y cerrar el panel 3 veces no genera error - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir y cerrar el panel 3 veces sin errores', async () => {
    await goToPageWithSession();

    for (let i = 0; i < 3; i++) {
      const fab = await waitVisible(driver, By.css('.support-fab'));
      await fab.click();
      await sleep(400);
      await waitVisible(driver, By.css('.support-chat-window'));

      const closeBtn = await driver.findElement(By.css('.chat-header button'));
      await closeBtn.click();
      await sleep(400);

      const windows = await driver.findElements(By.css('.support-chat-window'));
      expect(windows.length).toBe(0);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 20: El boton flotante de accion (FAB) es un elemento button nativo accesible - no requiere backend
  // Nota: el componente no define aria-label ni title; la accesibilidad viene
  // del elemento button nativo que es focusable por teclado por defecto
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el FAB como elemento button nativo accesible por teclado', async () => {
    await goToPageWithSession();

    const fab = await waitVisible(driver, By.css('.support-fab'));
    const tag = await fab.getTagName();
    expect(tag).toBe('button');
    expect(await fab.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 21: El panel no cubre completamente el contenido - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el panel de chat con ancho menor al de la ventana', async () => {
    await openChat();

    const chatWindow = await driver.findElement(By.css('.support-chat-window'));
    const panelWidth = await driver.executeScript(
      `return arguments[0].getBoundingClientRect().width`, chatWindow
    ) as number;
    const windowWidth = await driver.executeScript(`return window.innerWidth`) as number;

    expect(panelWidth).toBeLessThan(windowWidth);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 22: Limpiar input no envia mensaje - no requiere backend
  // Se usa executeScript para limpiar y disparar el evento input que Angular necesita
  // (Selenium clear() no dispara el evento input binding de Angular)
  // ──────────────────────────────────────────────────────────────
  it('Debe no enviar mensaje al limpiar el input y presionar el boton deshabilitado', async () => {
    await openChat();

    const chatInput = await waitVisible(driver, By.css('.chat-footer input'));
    await chatInput.sendKeys('texto temporal');
    await sleep(200);

    // Limpiar via JavaScript y disparar evento input para que Angular actualice el binding
    await driver.executeScript(`
      const el = arguments[0];
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    `, chatInput);
    await sleep(300);

    const sendBtn = await driver.findElement(By.css('.chat-footer button'));
    expect(await sendBtn.getAttribute('disabled')).not.toBeNull();

    const bubbles = await driver.findElements(By.css('.chat-body .bubble'));
    expect(bubbles.length).toBe(0);
  });
});
