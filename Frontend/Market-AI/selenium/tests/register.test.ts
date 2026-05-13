import { By, Key, until, WebDriver } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  BASE_URL,
  BACKEND_URL,
  TIMEOUT,
  checkBackendAvailable,
  injectToken,
  makeFakeJwt,
} from './auth-helper';

// ══════════════════════════════════════════════════════════════════════════════
// Suite RG-01 → RG-14 — Register Page (E2E Selenium)
// ══════════════════════════════════════════════════════════════════════════════
describe('RG — Register Page (E2E Selenium)', () => {
  let driver: WebDriver | undefined;
  let backendAvailable = false;

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

  async function goToRegister(): Promise<void> {
    await driver!.get(`${BASE_URL}/landing-page`);
    await driver!.executeScript(`
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
    `);
    await driver!.get(`${BASE_URL}/register`);
    await driver!.wait(until.elementLocated(By.css('input[formControlName="Nombre"]')), TIMEOUT);
  }

  async function fillRegisterForm(
    name: string,
    email: string,
    password: string,
    confirm: string,
    acceptTerms = true
  ): Promise<void> {
    await driver!.findElement(By.css('input[formControlName="Nombre"]')).sendKeys(name);
    await driver!.findElement(By.css('input[formControlName="Correo"]')).sendKeys(email);
    await driver!.findElement(By.css('input[formControlName="Contraseña"]')).sendKeys(password);
    await driver!.findElement(By.css('input[formControlName="Confirmar_contraseña"]')).sendKeys(confirm);
    if (acceptTerms) {
      const checkbox = await driver!.findElement(By.css('mat-checkbox'));
      await checkbox.click();
    }
  }

  // ─── RG-01 ─────────────────────────────────────────────────────────────────
  it('RG-01: El formulario carga con todos los campos requeridos', async () => {
    await goToRegister();

    expect(await driver!.findElement(By.css('input[formControlName="Nombre"]')).isDisplayed()).toBe(true);
    expect(await driver!.findElement(By.css('input[formControlName="Correo"]')).isDisplayed()).toBe(true);
    expect(await driver!.findElement(By.css('input[formControlName="Contraseña"]')).isDisplayed()).toBe(true);
    expect(await driver!.findElement(By.css('input[formControlName="Confirmar_contraseña"]')).isDisplayed()).toBe(true);
    expect(await driver!.findElement(By.css('mat-checkbox')).isDisplayed()).toBe(true);
    expect(
      await driver!.findElement(By.xpath('//button[contains(.,"Enviar")]')).isDisplayed()
    ).toBe(true);
  });

  // ─── RG-02 ─────────────────────────────────────────────────────────────────
  it('RG-02: Registro válido procesa submit correctamente [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  RG-02 omitida: backend no disponible.');
      return;
    }

    await goToRegister();

    const randomEmail =
      `test${Date.now()}@mail.com`;

    await fillRegisterForm(
      'Usuario Selenium',
      randomEmail,
      'password123',
      'password123',
      true
    );

    const submitBtn = await driver!.findElement(
      By.xpath('//button[contains(.,"Enviar")]')
    );

    await submitBtn.click();

    await driver!.sleep(2500);

    const url = await driver!.getCurrentUrl();

    expect(url).toContain('/register');
  });

  // ─── RG-04 ─────────────────────────────────────────────────────────────────
  it('RG-04: Nombre menor a 2 caracteres muestra error de longitud mínima', async () => {
    await goToRegister();
    const nameInput = await driver!.findElement(By.css('input[formControlName="Nombre"]'));
    await nameInput.sendKeys('A');
    await nameInput.sendKeys(Key.TAB);
    await driver!.sleep(200);

    const errorEl = await driver!.wait(
      until.elementLocated(By.xpath('//mat-error[contains(., "2")]')),
      TIMEOUT
    );
    expect(await errorEl.isDisplayed()).toBe(true);
  });

  // ─── RG-05 ─────────────────────────────────────────────────────────────────
  it('RG-05: Email con formato inválido muestra error de formato', async () => {
    await goToRegister();
    const emailInput = await driver!.findElement(By.css('input[formControlName="Correo"]'));
    await emailInput.sendKeys('notanemail');
    await emailInput.sendKeys(Key.TAB);
    await driver!.sleep(200);

    const errorEl = await driver!.wait(
      until.elementLocated(By.xpath('//mat-error[contains(., "correo")]')),
      TIMEOUT
    );
    expect(await errorEl.isDisplayed()).toBe(true);
  });

  // ─── RG-06 ─────────────────────────────────────────────────────────────────
  it('RG-06: Password menor a 8 caracteres muestra error de longitud', async () => {
    await goToRegister();
    const passInput = await driver!.findElement(By.css('input[formControlName="Contraseña"]'));
    await passInput.sendKeys('short');
    await passInput.sendKeys(Key.TAB);
    await driver!.sleep(200);

    const errorEl = await driver!.wait(
      until.elementLocated(By.xpath('//mat-error[contains(., "8")]')),
      TIMEOUT
    );
    expect(await errorEl.isDisplayed()).toBe(true);
  });

  // ─── RG-07 ─────────────────────────────────────────────────────────────────
  it('RG-07: Contraseñas que no coinciden muestran error "mismatch"', async () => {
    await goToRegister();
    await driver!.findElement(By.css('input[formControlName="Contraseña"]')).sendKeys('password123');
    const confirmInput = await driver!.findElement(By.css('input[formControlName="Confirmar_contraseña"]'));
    await confirmInput.sendKeys('differentpass');
    await confirmInput.sendKeys(Key.TAB);
    await driver!.sleep(200);

    const errorEl = await driver!.wait(
      until.elementLocated(By.xpath('//mat-error[contains(., "coincidir") or contains(., "coinciden")]')),
      TIMEOUT
    );
    expect(await errorEl.isDisplayed()).toBe(true);
  });

  // ─── RG-08 ─────────────────────────────────────────────────────────────────
  it('RG-08: Sin marcar términos el botón Enviar está deshabilitado', async () => {
    await goToRegister();
    await fillRegisterForm('Test User', 'test@example.com', 'password123', 'password123', false);
    await driver!.sleep(200);

    const sendBtn = await driver!.findElement(By.xpath('//button[contains(.,"Enviar")]'));
    expect(await sendBtn.isEnabled()).toBe(false);
  });

  // ─── RG-09 ─────────────────────────────────────────────────────────────────
  it('RG-09: Botón Enviar deshabilitado con formulario completamente vacío', async () => {
    await goToRegister();
    const sendBtn = await driver!.findElement(By.xpath('//button[contains(.,"Enviar")]'));
    expect(await sendBtn.isEnabled()).toBe(false);
  });

  // ─── RG-10 ─────────────────────────────────────────────────────────────────
  it('RG-10: Navegar con parámetro error mantiene página register', async () => {
    await driver!.get(
      `${BASE_URL}/register?error=email_already_used`
    );

    await driver!.sleep(1000);

    const url = await driver!.getCurrentUrl();

    expect(url).toContain('/register');
  });

  // ─── RG-11 ─────────────────────────────────────────────────────────────────
  it('RG-11: Botón Google redirige al proveedor OAuth [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  RG-11 omitida: backend no disponible.');
      return;
    }

    await goToRegister();
    const googleBtn = await driver!.findElement(By.xpath('//button[contains(., "Google")]'));
    await googleBtn.click();
    await driver!.sleep(2000);

    const url = await driver!.getCurrentUrl();
    expect(
      url.includes('accounts.google.com') ||
        url.includes('/auth/google') ||
        url.includes('google')
    ).toBe(true);
  });

  // ─── RG-12 ─────────────────────────────────────────────────────────────────
  it('RG-12: Link "Iniciar Sesión" navega a /login', async () => {
    await goToRegister();
    const link = await driver!.findElement(By.xpath('//a[contains(., "Iniciar Sesión")]'));
    await link.click();
    await driver!.wait(until.urlContains('/login'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/login');
  });

  // ─── RG-13 ─────────────────────────────────────────────────────────────────
  it('RG-13: Usuario autenticado al navegar a /register es redirigido a /home-page', async () => {
    await injectToken(driver!, makeFakeJwt('user'), 'user');
    await driver!.get(`${BASE_URL}/register`);
    await driver!.sleep(1000);

    const url = await driver!.getCurrentUrl();
    expect(url).not.toContain('/register');
  });

  // ─── RG-14 ─────────────────────────────────────────────────────────────────
  it('RG-14: Botón Enviar deshabilitado con formulario inválido (passwords no coinciden)', async () => {
    await goToRegister();
    await fillRegisterForm('Test User', 'test@example.com', 'password123', 'differentpass');
    await driver!.sleep(200);

    const sendBtn = await driver!.findElement(By.xpath('//button[contains(.,"Enviar")]'));
    expect(await sendBtn.isEnabled()).toBe(false);
  });

  // ─── RG-extra-01 ─────────────────────────────────────────────────────────────

  it('RG-extra-01: Botón Cancelar navega fuera de /register', async () => {
    // Primero ir a otra página para tener historial de navegación
    await driver!.get(`${BASE_URL}/login`);
    await goToRegister();

    const cancelBtn = await driver!.findElement(By.xpath('//button[contains(.,"Cancelar")]'));
    await cancelBtn.click();
    await driver!.sleep(500);

    const url = await driver!.getCurrentUrl();
    expect(url).not.toContain('/register');
  });

  // ─── RG-extra-02 ─────────────────────────────────────────────────────────────
  it('RG-extra-02: Checkbox Terms habilita/deshabilita el botón Enviar', async () => {
    await goToRegister();

    await fillRegisterForm(
      'Test User',
      'test@example.com',
      'password123',
      'password123',
      false
    );

    const sendBtn = await driver!.findElement(
      By.xpath('//button[contains(.,"Enviar")]')
    );

    expect(await sendBtn.isEnabled()).toBe(false);

    const checkbox = await driver!.findElement(By.css('mat-checkbox'));

    await checkbox.click();

    await driver!.sleep(300);

    expect(await sendBtn.isEnabled()).toBe(true);
  });


});
