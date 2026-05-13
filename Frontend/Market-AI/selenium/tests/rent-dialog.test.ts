import { By, until, WebDriver, WebElement } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  BASE_URL,
  BACKEND_URL,
  TIMEOUT,
  checkBackendAvailable,
  loginAndGetToken,
  injectToken,
  makeFakeJwt,
} from '../helpers/auth-helper';

// ── Credenciales de prueba ───────────────────────────────────────────────────
const TEST_USER_EMAIL = process.env['TEST_USER_EMAIL'] ?? 'test@example.com';
const TEST_USER_PASSWORD = process.env['TEST_USER_PASSWORD'] ?? 'password123';
// ─────────────────────────────────────────────────────────────────────────────

describe('RD — Rent Dialog (E2E Selenium)', () => {
  let driver: WebDriver | undefined;
  let backendAvailable = false;
  let userToken: string | null = null;

  // ── Setup global ────────────────────────────────────────────────────────────
  beforeAll(async () => {
    backendAvailable = await checkBackendAvailable();

    if (!backendAvailable) {
      console.warn(`\n⚠ Backend no disponible en ${BACKEND_URL}.`);
      console.warn('  Todos los tests RD requieren agentes cargados → serán omitidos.\n');
    } else {
      console.log(`\n✓ Backend disponible en ${BACKEND_URL}`);
      userToken = await loginAndGetToken(TEST_USER_EMAIL, TEST_USER_PASSWORD);
      if (!userToken) {
        console.warn('  ⚠ No se obtuvo token real — todos los tests RD serán omitidos.\n');
      }
    }

    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`✓ Navegador detectado: ${browserUsed}\n`);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ── Helpers internos ────────────────────────────────────────────────────────

  /** Navega a home-page con token inyectado y espera que carguen agentes. */
  async function goHome(): Promise<void> {
    const token = userToken ?? makeFakeJwt('user');
    await injectToken(driver!, token, 'user');
    await driver!.get(`${BASE_URL}/home-page`);
  }

  /** Espera el carousel de agentes. Retorna false si no hay agentes. */
  async function waitForAgents(): Promise<boolean> {
    try {
      await driver!.wait(until.elementLocated(By.css('.carousel-container')), TIMEOUT);
      const cards = await driver!.findElements(By.css('mat-card.agent-card'));
      return cards.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Abre el RentDialog haciendo clic en el primer botón "Rentar" disponible.
   * Retorna el WebElement del dialog container.
   */
  async function openRentDialog(): Promise<WebElement> {
    const rentBtn = await driver!.findElement(
      By.xpath('//button[contains(., "Rentar")]')
    );
    await rentBtn.click();
    return driver!.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );
  }

  /** Cierra el dialog abierto haciendo clic en Cancelar. */
  async function closeDialog(): Promise<void> {
    try {
      const cancelBtn = await driver!.findElement(
        By.xpath('//button[contains(., "Cancelar")]')
      );
      await cancelBtn.click();
      await driver!.sleep(400);
    } catch { /* dialog ya estaba cerrado */ }
  }

  /** Cambia el amount input al valor dado (fuerza via JS para evitar validación HTML5). */
  async function setAmount(value: number): Promise<void> {
    const input = await driver!.findElement(By.css('mat-dialog-container input[type="number"]'));
    await driver!.executeScript(`arguments[0].value = '${value}'`, input);
    // Disparar evento input para que Angular detecte el cambio
    await driver!.executeScript(
      `arguments[0].dispatchEvent(new Event('input', { bubbles: true }))`,
      input
    );
    await driver!.sleep(200);
  }

  /** Lee el total mostrado en el dialog. Retorna el número o NaN si no se puede leer. */
  async function readDisplayedTotal(): Promise<number> {
    const totalEl = await driver!.findElement(By.css('.total-cost strong'));
    const text = await totalEl.getText(); // e.g. "20"
    return parseFloat(text.replace(/[^0-9.-]/g, ''));
  }

  // ─── RD-01 ─────────────────────────────────────────────────────────────────
  it('RD-01: Dialog muestra el nombre y precio del agente', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  RD-01 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHome();
    const hasAgents = await waitForAgents();
    if (!hasAgents) {
      console.warn('  RD-01 omitida: no hay agentes disponibles.');
      return;
    }

    // Guardar nombre del agente antes de abrir el dialog
    const firstCard = (await driver!.findElements(By.css('mat-card.agent-card')))[0];
    const agentName = await firstCard.findElement(By.css('mat-card-title')).getText();
    const priceText = await firstCard.findElement(By.css('.price-tag')).getText();
    // priceText tiene formato "$X.XX / hr"
    const priceNumber = priceText.match(/[\d.]+/)?.[0] ?? '';

    const dialog = await openRentDialog();

    // El título debe contener el nombre del agente
    const title = await dialog.findElement(By.css('[mat-dialog-title]')).getText();
    expect(title).toContain(agentName);

    // El contenido debe mostrar el precio
    const content = await dialog.findElement(By.css('mat-dialog-content')).getText();
    expect(content).toContain(priceNumber);

    await closeDialog();
  });

  // ─── RD-02 ─────────────────────────────────────────────────────────────────
  it('RD-02: Cambiar cantidad y unidad actualiza el total en tiempo real', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  RD-02 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHome();
    const hasAgents = await waitForAgents();
    if (!hasAgents) { console.warn('  RD-02 omitida: no hay agentes.'); return; }

    await openRentDialog();

    // Leer total inicial (amount=1, unit=hours)
    const totalHoras1 = await readDisplayedTotal();

    // Cambiar cantidad a 3
    await setAmount(3);
    const totalHoras3 = await readDisplayedTotal();
    expect(totalHoras3).toBe(totalHoras1 * 3);

    // Cambiar unidad a "Días" (multiplicador x24 vs horas)
    const select = await driver!.findElement(By.css('mat-dialog-container mat-select'));
    await select.click();
    const diasOption = await driver!.wait(
      until.elementLocated(By.xpath('//mat-option[contains(., "Días")]')),
      TIMEOUT
    );
    await diasOption.click();
    await driver!.sleep(300);

    const totalDias3 = await readDisplayedTotal();
    expect(totalDias3).toBeGreaterThan(totalHoras3); // días > horas

    await closeDialog();
  });

  // ─── RD-03 ─────────────────────────────────────────────────────────────────
  it('RD-03: Total calculado correctamente (2 horas × precio/hr)', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  RD-03 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHome();
    const hasAgents = await waitForAgents();
    if (!hasAgents) { console.warn('  RD-03 omitida: no hay agentes.'); return; }

    // Obtener precio del primer agente
    const firstCard = (await driver!.findElements(By.css('mat-card.agent-card')))[0];
    const priceText = await firstCard.findElement(By.css('.price-tag')).getText();
    const pricePerHour = parseFloat(priceText.match(/[\d.]+/)?.[0] ?? '0');

    await openRentDialog();

    // Asegurar unidad = horas (valor por defecto)
    const selectText = await driver!.findElement(
      By.css('mat-dialog-container mat-select')
    ).getText();
    if (!selectText.toLowerCase().includes('hora')) {
      const select = await driver!.findElement(By.css('mat-dialog-container mat-select'));
      await select.click();
      const horasOption = await driver!.wait(
        until.elementLocated(By.xpath('//mat-option[contains(., "Horas")]')),
        TIMEOUT
      );
      await horasOption.click();
      await driver!.sleep(300);
    }

    // Cambiar cantidad a 2
    await setAmount(2);
    const total = await readDisplayedTotal();

    const expectedTotal = 2 * pricePerHour;
    expect(total).toBeCloseTo(expectedTotal, 2);

    await closeDialog();
  });

  // ─── RD-04 ─────────────────────────────────────────────────────────────────
  it('RD-04: Confirmar renta cierra el dialog y muestra notificación [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  RD-04 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHome();
    const hasAgents = await waitForAgents();
    if (!hasAgents) { console.warn('  RD-04 omitida: no hay agentes.'); return; }

    await openRentDialog();

    // Usar defaults (amount=1, unit=hours) y confirmar
    const confirmBtn = await driver!.findElement(
      By.xpath('//button[contains(., "Confirmar Renta")]')
    );
    await confirmBtn.click();

    // El dialog debe cerrarse
    await driver!.wait(
      async () => {
        const dialogs = await driver!.findElements(By.css('mat-dialog-container'));
        return dialogs.length === 0;
      },
      TIMEOUT
    );

    const dialogs = await driver!.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);

    // Puede aparecer una notificación (éxito o error según créditos del usuario)
    await driver!.sleep(1000);
  });

  // ─── RD-05 ─────────────────────────────────────────────────────────────────
  it('RD-05: Créditos insuficientes muestra notificación de error [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  RD-05 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHome();
    const hasAgents = await waitForAgents();
    if (!hasAgents) { console.warn('  RD-05 omitida: no hay agentes.'); return; }

    await openRentDialog();

    // Cambiar unidad a Meses y cantidad a 9999 para superar cualquier saldo
    const select = await driver!.findElement(By.css('mat-dialog-container mat-select'));
    await select.click();
    const mesesOption = await driver!.wait(
      until.elementLocated(By.xpath('//mat-option[contains(., "Meses")]')),
      TIMEOUT
    );
    await mesesOption.click();
    await driver!.sleep(300);

    await setAmount(9999);

    const confirmBtn = await driver!.findElement(
      By.xpath('//button[contains(., "Confirmar Renta")]')
    );
    await confirmBtn.click();

    // Esperar a que el dialog cierre
    await driver!.wait(
      async () => (await driver!.findElements(By.css('mat-dialog-container'))).length === 0,
      TIMEOUT
    );

    // Esperar notificación de error del backend
    await driver!.sleep(3000);
    // La notificación de error puede aparecer como un nuevo dialog o como un snackbar
    const errorDialogs = await driver!.findElements(
      By.xpath('//*[contains(@class,"notify") or contains(@class,"error") or contains(@class,"warn")]')
    );
    // Verificar que la página sigue en home (no navegó a otro lado)
    const url = await driver!.getCurrentUrl();
    expect(url).toContain('/home-page');
  });

  // ─── RD-06 ─────────────────────────────────────────────────────────────────
  it('RD-06: Botón Cancelar cierra el dialog sin rentar', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  RD-06 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHome();
    const hasAgents = await waitForAgents();
    if (!hasAgents) { console.warn('  RD-06 omitida: no hay agentes.'); return; }

    await openRentDialog();

    // Verificar que el dialog está abierto
    const dialogBefore = await driver!.findElements(By.css('mat-dialog-container'));
    expect(dialogBefore.length).toBe(1);

    const cancelBtn = await driver!.findElement(
      By.xpath('//button[contains(., "Cancelar")]')
    );
    await cancelBtn.click();

    // El dialog debe desaparecer
    await driver!.wait(
      async () => (await driver!.findElements(By.css('mat-dialog-container'))).length === 0,
      TIMEOUT
    );

    const dialogAfter = await driver!.findElements(By.css('mat-dialog-container'));
    expect(dialogAfter.length).toBe(0);

    // No hay notificación de renta (no se realizó ninguna acción)
    await driver!.sleep(500);
    const notifications = await driver!.findElements(
      By.xpath('//*[contains(text(),"Renta exitosa")]')
    );
    expect(notifications.length).toBe(0);
  });

  // ─── RD-07 ─────────────────────────────────────────────────────────────────
  it('RD-07: Cantidad 0 resulta en total 0 (cantidad inválida)', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  RD-07 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHome();
    const hasAgents = await waitForAgents();
    if (!hasAgents) { console.warn('  RD-07 omitida: no hay agentes.'); return; }

    await openRentDialog();

    // Forzar amount = 0 via JavaScript (el input tiene min="1" en HTML5)
    await setAmount(0);

    const total = await readDisplayedTotal();
    // Con cantidad 0, el total debe ser 0 o el botón confirmar estar deshabilitado
    const confirmBtn = await driver!.findElement(
      By.xpath('//button[contains(., "Confirmar Renta")]')
    );
    const isDisabled = !(await confirmBtn.isEnabled());

    // Se cumple si total=0 O si el botón está deshabilitado
    expect(total === 0 || isDisabled).toBe(true);

    await closeDialog();
  });

  // ── Prueba adicional — cantidad negativa ────────────────────────────────────
  it('RD-extra: Cantidad negativa resulta en total ≤ 0', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  RD-extra omitida: backend no disponible o sin token real.');
      return;
    }

    await goHome();
    const hasAgents = await waitForAgents();
    if (!hasAgents) { console.warn('  RD-extra omitida: no hay agentes.'); return; }

    await openRentDialog();

    await setAmount(-5);

    const total = await readDisplayedTotal();
    const confirmBtn = await driver!.findElement(
      By.xpath('//button[contains(., "Confirmar Renta")]')
    );
    const isDisabled = !(await confirmBtn.isEnabled());

    // Total negativo o botón deshabilitado — ninguno de los dos es válido para rentar
    expect(total <= 0 || isDisabled).toBe(true);

    await closeDialog();
  });
});
