// Tests E2E - Support Widget (SW-01 a SW-08)
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

  // Helper: navega a landing-page con sesion activa y espera el FAB
  async function goToPageWithSession(): Promise<void> {
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/landing-page');
    await sleep(2000);
  }

  // Helper: abre la ventana de chat (asume sesion activa y FAB visible)
  async function openChat(): Promise<void> {
    await goToPageWithSession();
    const fab = await waitVisible(driver, By.css('.support-fab'));
    await fab.click();
    await sleep(500);
    await waitVisible(driver, By.css('.support-chat-window'));
  }

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 1: FAB no visible sin sesion activa - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe ocultar el FAB de soporte cuando no hay sesion activa', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await sleep(2000);

    const fabs = await driver.findElements(By.css('.support-fab'));
    expect(fabs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 2: FAB visible cuando hay sesion activa - no requiere backend
  // El widget usa isLoggedIn$ del AuthService para mostrar el boton
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el FAB de soporte cuando hay sesion activa', async () => {
    await goToPageWithSession();

    const fab = await waitVisible(driver, By.css('.support-fab'));
    expect(await fab.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 3: Click en FAB abre la ventana de chat - no requiere backend
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
});
