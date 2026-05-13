import { By, Key, until, WebDriver } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  BASE_URL,
  BACKEND_URL,
  TIMEOUT,
  checkBackendAvailable,
} from './auth-helper';

// ══════════════════════════════════════════════════════════════════════════════
// Suite RP-01 → RP-08 — Reset Password Page (E2E Selenium)
// ══════════════════════════════════════════════════════════════════════════════
describe('RP — Reset Password Page (E2E Selenium)', () => {
  let driver: WebDriver | undefined;
  let backendAvailable = false;

  // Token de prueba — en tests reales debería ser uno obtenido del backend
  const FAKE_RESET_TOKEN = 'fake-reset-token-for-ui-testing';

  beforeAll(async () => {
    backendAvailable = await checkBackendAvailable();
    if (backendAvailable) {
      console.log(`\n✓ Backend disponible en ${BACKEND_URL}`);
    } else {
      console.warn('\n⚠ Backend no disponible — pruebas [BE] serán omitidas.\n');
    }

    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`✓ Navegador: ${browserUsed}\n`);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function goToResetWithToken(token = FAKE_RESET_TOKEN): Promise<void> {
    await driver!.get(`${BASE_URL}/reset-password?token=${token}`);
    await driver!.wait(
      until.elementLocated(By.css('.contenedor-registro')),
      TIMEOUT
    );
  }

  async function goToResetWithoutToken(): Promise<void> {
    await driver!.get(`${BASE_URL}/reset-password`);
    await driver!.wait(
      until.elementLocated(By.css('.contenedor-registro')),
      TIMEOUT
    );
  }

  // ─── RP-01 ─────────────────────────────────────────────────────────────────
  it('RP-01: Con token en URL el formulario de restablecimiento es visible', async () => {
    await goToResetWithToken();

    const form = await driver!.findElement(By.css('form'));
    expect(await form.isDisplayed()).toBe(true);

    expect(
      await driver!.findElement(By.css('input[formControlName="Contrasena"]')).isDisplayed()
    ).toBe(true);
    expect(
      await driver!.findElement(By.css('input[formControlName="ConfirmarContrasena"]')).isDisplayed()
    ).toBe(true);
  });

  // ─── RP-02 ─────────────────────────────────────────────────────────────────
  it('RP-02: Sin token en URL el formulario NO se muestra (mensaje de enlace inválido)', async () => {
    await goToResetWithoutToken();
    await driver!.sleep(500);

    // El template muestra mensaje de enlace inválido en lugar del form
    const forms = await driver!.findElements(By.css('form'));
    const msgs = await driver!.findElements(
      By.xpath('//*[contains(text(), "inválido") or contains(text(), "incompleto")]')
    );

    expect(forms.length === 0 || msgs.length > 0).toBe(true);
  });

  // ─── RP-03 ─────────────────────────────────────────────────────────────────
  it('RP-03: Cambio de contraseña exitoso con token válido navega a /login [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  RP-03 omitida: requiere token real del backend.');
      return;
    }

    // Este test requiere un token de restablecimiento real obtenido desde el backend
    // Navegar con el token de la variable de entorno
    const realToken = process.env['TEST_RESET_TOKEN'];
    if (!realToken) {
      console.warn('  RP-03 omitida: TEST_RESET_TOKEN no configurado.');
      return;
    }

    await goToResetWithToken(realToken);
    await driver!.findElement(By.css('input[formControlName="Contrasena"]')).sendKeys('NewPassword123');
    await driver!.findElement(By.css('input[formControlName="ConfirmarContrasena"]')).sendKeys('NewPassword123');
    await driver!.findElement(By.xpath('//button[contains(.,"Guardar")]')).click();

    await driver!.wait(until.urlContains('/login'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/login');
  });

  // ─── RP-04 ─────────────────────────────────────────────────────────────────
  it('RP-04: Token inválido al submit muestra dialog de error [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  RP-04 omitida: backend no disponible.');
      return;
    }

    await goToResetWithToken('invalid-expired-token-123');

    await driver!
      .findElement(By.css('input[formControlName="Contrasena"]'))
      .sendKeys('NewPassword123');

    await driver!
      .findElement(By.css('input[formControlName="ConfirmarContrasena"]'))
      .sendKeys('NewPassword123');

    await driver!
      .findElement(By.xpath('//button[contains(.,"Guardar")]'))
      .click();

    const dialog = await driver!.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );

    await driver!.wait(async () => {
      const text = await dialog.getText();
      return text.trim().length > 0;
    }, TIMEOUT);

    const text = (await dialog.getText()).toLowerCase();

    expect(text).toMatch(/inválido|expirado|error/);
  });

  // ─── RP-05 ─────────────────────────────────────────────────────────────────
  it('RP-05: Password menor a 8 caracteres muestra error de longitud', async () => {
    await goToResetWithToken();

    const passInput = await driver!.findElement(By.css('input[formControlName="Contrasena"]'));
    await passInput.sendKeys('short');
    await passInput.sendKeys(Key.TAB);
    await driver!.sleep(200);

    const errorEl = await driver!.wait(
      until.elementLocated(By.xpath('//mat-error[contains(., "8")]')),
      TIMEOUT
    );
    expect(await errorEl.isDisplayed()).toBe(true);
  });

  // ─── RP-06 ─────────────────────────────────────────────────────────────────
  it('RP-06: Contraseñas que no coinciden muestran error "mismatch"', async () => {
    await goToResetWithToken();

    await driver!.findElement(By.css('input[formControlName="Contrasena"]')).sendKeys('password123');
    const confirmInput = await driver!.findElement(
      By.css('input[formControlName="ConfirmarContrasena"]')
    );
    await confirmInput.sendKeys('differentpass');
    await confirmInput.sendKeys(Key.TAB);
    await driver!.sleep(200);

    const errorEl = await driver!.wait(
      until.elementLocated(By.xpath('//mat-error[contains(., "coincidir") or contains(., "coinciden")]')),
      TIMEOUT
    );
    expect(await errorEl.isDisplayed()).toBe(true);
  });

  // ─── RP-07 ─────────────────────────────────────────────────────────────────
  it('RP-07: Botón Cancelar existe y puede presionarse', async () => {
    await goToResetWithToken();

    const cancelBtn = await driver!.findElement(
      By.xpath('//button[contains(.,"Cancelar")]')
    );

    expect(await cancelBtn.isDisplayed()).toBe(true);

    await cancelBtn.click();

    await driver!.sleep(300);
  });

  // TESTS EXTRA

  // ─── RP-extra-01 ─────────────────────────────────────────────────────────────
  it('RP-extra-01: Botón Guardar deshabilitado cuando passwords no coinciden', async () => {
    await goToResetWithToken();

    await driver!.findElement(
      By.css('input[formControlName="Contrasena"]')
    ).sendKeys('password123');

    await driver!.findElement(
      By.css('input[formControlName="ConfirmarContrasena"]')
    ).sendKeys('differentpass');

    await driver!.sleep(300);

    const saveBtn = await driver!.findElement(
      By.xpath('//button[contains(.,"Guardar")]')
    );

    expect(await saveBtn.isEnabled()).toBe(false);
  });

  // ─── RP-extra-02 ─────────────────────────────────────────────────────────────
  it('RP-extra-02: Botón Cancelar navega fuera de /reset-password', async () => {
    await driver!.get(`${BASE_URL}/login`);

    await goToResetWithToken();

    const cancelBtn = await driver!.findElement(
      By.xpath('//button[contains(.,"Cancelar")]')
    );

    await cancelBtn.click();

    await driver!.sleep(500);

    const url = await driver!.getCurrentUrl();

    expect(url).not.toContain('/reset-password');
  });

});
