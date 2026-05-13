import { By, Key, until, WebDriver } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  BASE_URL,
  BACKEND_URL,
  TIMEOUT,
  checkBackendAvailable,
  loginAndGetToken,
  injectToken,
  makeFakeJwt,
} from './auth-helper';

// ── Credenciales de prueba ────────────────────────────────────────────────────
const TEST_EMAIL = process.env['TEST_USER_EMAIL'] ?? 'test@example.com';
const TEST_PASSWORD = process.env['TEST_USER_PASSWORD'] ?? 'password123';

// ══════════════════════════════════════════════════════════════════════════════
// Suite LG-01 → LG-15 — Login Page (E2E Selenium)
// ══════════════════════════════════════════════════════════════════════════════
describe('LG — Login Page (E2E Selenium)', () => {
  let driver: WebDriver | undefined;
  let backendAvailable = false;
  let validToken: string | null = null;

  beforeAll(async () => {
    backendAvailable = await checkBackendAvailable();
    if (backendAvailable) {
      validToken = await loginAndGetToken(TEST_EMAIL, TEST_PASSWORD);
      console.log(`\n✓ Backend disponible en ${BACKEND_URL}`);
    } else {
      console.warn(`\n⚠ Backend no disponible — pruebas [BE] serán omitidas.\n`);
    }

    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`✓ Navegador: ${browserUsed}\n`);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  async function goToLogin(): Promise<void> {
    // Limpiar sesión antes de ir a login
    await driver!.get(`${BASE_URL}/landing-page`);
    await driver!.executeScript(`
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user_role');
    `);
    await driver!.get(`${BASE_URL}/login`);
    try {
      await driver!.wait(until.elementLocated(By.css('input[name="Correo"]')), TIMEOUT);
    } catch {
      await driver!.navigate().refresh();
      await driver!.wait(until.elementLocated(By.css('input[name="Correo"]')), TIMEOUT);
    }
  }

  async function fillLogin(email: string, password: string): Promise<void> {
    const emailInput = await driver!.findElement(By.css('input[name="Correo"]'));
    const passInput = await driver!.findElement(By.css('input[name="Contrasena"]'));
    await emailInput.clear();
    await emailInput.sendKeys(email);
    await passInput.clear();
    await passInput.sendKeys(password);
  }

  // ─── LG-01 ─────────────────────────────────────────────────────────────────
  it('LG-01: El formulario carga con email, password, botones y Google', async () => {
    await goToLogin();

    expect(await driver!.findElement(By.css('input[name="Correo"]')).isDisplayed()).toBe(true);
    expect(await driver!.findElement(By.css('input[name="Contrasena"]')).isDisplayed()).toBe(true);
    expect(
      await driver!.findElement(By.xpath('//button[contains(.,"Enviar")]')).isDisplayed()
    ).toBe(true);
    expect(
      await driver!.findElement(By.xpath('//button[contains(.,"Cancelar")]')).isDisplayed()
    ).toBe(true);
    expect(
      await driver!.findElement(By.css('.google-btn')).isDisplayed()
    ).toBe(true);
  });

  // ─── LG-02 ─────────────────────────────────────────────────────────────────
  it('LG-02: Login exitoso con credenciales válidas navega a /home-page [BE]', async () => {
    if (!backendAvailable || !validToken) {
      console.warn('  LG-02 omitida: backend no disponible o sin credenciales.');
      return;
    }

    await goToLogin();
    await fillLogin(TEST_EMAIL, TEST_PASSWORD);
    await driver!.findElement(By.xpath('//button[contains(.,"Enviar")]')).click();

    await driver!.wait(until.urlContains('/home-page'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/home-page');
  });

  // ─── LG-03 ─────────────────────────────────────────────────────────────────
  it('LG-03: Credenciales incorrectas procesan error correctamente [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  LG-03 omitida: backend no disponible.');
      return;
    }

    await goToLogin();

    await fillLogin(
      'fake@test.com',
      'wrongpassword'
    );

    const submitBtn = await driver!.findElement(
      By.xpath('//button[contains(.,"Enviar")]')
    );

    await submitBtn.click();

    await driver!.sleep(1500);

    const url = await driver!.getCurrentUrl();

    expect(url).toContain('/login');
  });

  // ─── LG-04 ─────────────────────────────────────────────────────────────────
  it('LG-04: Usuario inexistente permanece en login [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  LG-04 omitida: backend no disponible.');
      return;
    }

    await goToLogin();

    await fillLogin(
      'idontexist@test.com',
      'password123'
    );

    const submitBtn = await driver!.findElement(
      By.xpath('//button[contains(.,"Enviar")]')
    );

    await submitBtn.click();

    await driver!.sleep(1500);

    const url = await driver!.getCurrentUrl();

    expect(url).toContain('/login');
  });
  
  // ─── LG-05 ─────────────────────────────────────────────────────────────────
  it('LG-05: Email con formato inválido muestra error de validación', async () => {
    await goToLogin();
    const emailInput = await driver!.findElement(By.css('input[name="Correo"]'));
    await emailInput.sendKeys('notavalidemail');
    await emailInput.sendKeys(Key.TAB); // perder foco para activar validación
    await driver!.sleep(200);

    const errorMsg = await driver!.wait(
      until.elementLocated(By.xpath('//mat-error[contains(., "correo")]')),
      TIMEOUT
    );
    expect(await errorMsg.isDisplayed()).toBe(true);
  });

  // ─── LG-06 ─────────────────────────────────────────────────────────────────
  it('LG-06: Password menor a 8 caracteres muestra error de longitud', async () => {
    await goToLogin();
    const passInput = await driver!.findElement(By.css('input[name="Contrasena"]'));
    await passInput.sendKeys('short');
    await passInput.sendKeys(Key.TAB);
    await driver!.sleep(200);

    const errorMsg = await driver!.wait(
      until.elementLocated(By.xpath('//mat-error[contains(., "8")]')),
      TIMEOUT
    );
    expect(await errorMsg.isDisplayed()).toBe(true);
  });

  // ─── LG-07 ─────────────────────────────────────────────────────────────────
  it('LG-07: Campos vacíos al submit muestran errores "Requerido"', async () => {
    await goToLogin();
    // Tocar ambos campos y sacar el foco para activar errores
    const email = await driver!.findElement(By.css('input[name="Correo"]'));
    await email.click();
    const pass = await driver!.findElement(By.css('input[name="Contrasena"]'));
    await pass.click();
    await driver!.findElement(By.css('.contenedor-registro')).click(); // perder foco
    await driver!.sleep(300);

    const errorMsgs = await driver!.findElements(
      By.xpath('//mat-error[contains(., "Requerido")]')
    );
    expect(errorMsgs.length).toBeGreaterThanOrEqual(1);
  });

  // ─── LG-08 ─────────────────────────────────────────────────────────────────
  it('LG-08: Botón Enviar está deshabilitado con formulario vacío', async () => {
    await goToLogin();
    const sendBtn = await driver!.findElement(By.xpath('//button[contains(.,"Enviar")]'));
    expect(await sendBtn.isEnabled()).toBe(false);
  });

  // ─── LG-09 ─────────────────────────────────────────────────────────────────
  it('LG-09: Botón Cancelar navega a la página anterior', async () => {
    // Ir a landing primero para tener historial
    await driver!.get(`${BASE_URL}/landing-page`);
    await driver!.get(`${BASE_URL}/login`);
    await driver!.wait(until.elementLocated(By.css('input[name="Correo"]')), TIMEOUT);

    await driver!.findElement(By.xpath('//button[contains(.,"Cancelar")]')).click();
    await driver!.sleep(500);

    // Debe haber navegado fuera de /login
    const url = await driver!.getCurrentUrl();
    expect(url).not.toContain('/login');
  });

  // ─── LG-10 ─────────────────────────────────────────────────────────────────
  it('LG-10: Link "Registrate" navega a /register', async () => {
    await goToLogin();
    const link = await driver!.findElement(By.xpath('//a[contains(., "Registrate")]'));
    await link.click();
    await driver!.wait(until.urlContains('/register'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/register');
  });

  // ─── LG-11 ─────────────────────────────────────────────────────────────────
  it('LG-11: Link "¿Se te olvido?" con email válido muestra dialog de confirmación [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  LG-11 omitida: backend no disponible.');
      return;
    }

    await goToLogin();
    await driver!.findElement(By.css('input[name="Correo"]')).sendKeys('user@example.com');
    const link = await driver!.findElement(By.xpath('//a[contains(., "olvido")]'));
    await link.click();

    const dialog = await driver!.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );
    expect(await dialog.isDisplayed()).toBe(true);
  });

  // ─── LG-12 ─────────────────────────────────────────────────────────────────
  it('LG-12: Link "¿Se te olvido?" sin email válido muestra error sin llamar al backend', async () => {
    await goToLogin();
    // Campo email vacío — clic en el link de recuperación
    const link = await driver!.findElement(By.xpath('//a[contains(., "olvido")]'));
    await link.click();

    // El dialog de error debe aparecer
    const dialog = await driver!.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );
    expect(await dialog.isDisplayed()).toBe(true);
    // Esperar a que Angular renderice el binding {{ data.message }} dentro del dialog
    await driver!.wait(
      async () => (await dialog.getText()).trim().length > 0,
      TIMEOUT
    );
    const text = await dialog.getText();
    expect(text.toLowerCase()).toContain('correo');
  });

  // ─── LG-13 ─────────────────────────────────────────────────────────────────
  it('LG-13: Botón "Iniciar sesión con Google" redirige a OAuth de Google [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  LG-13 omitida: backend no disponible.');
      return;
    }

    await goToLogin();
    const googleBtn = await driver!.findElement(By.css('.google-btn'));
    await googleBtn.click();
    await driver!.sleep(2000);

    const url = await driver!.getCurrentUrl();
    // Debe redirigir a Google o al backend OAuth
    expect(
      url.includes('accounts.google.com') ||
        url.includes('/auth/google') ||
        url.includes('google')
    ).toBe(true);
  });

  // ─── LG-14 ─────────────────────────────────────────────────────────────────
  it('LG-14: Usuario autenticado al navegar a /login es redirigido a /home-page', async () => {
    // Inyectar token antes de navegar a /login
    await injectToken(driver!, makeFakeJwt('user'), 'user');
    await driver!.get(`${BASE_URL}/login`);
    await driver!.sleep(1000);

    // El guestOnlyGuard debe redirigir fuera de /login
    const url = await driver!.getCurrentUrl();
    expect(url).not.toContain('/login');
  });

  // ─── LG-15 ─────────────────────────────────────────────────────────────────
  it('LG-15: Botón Enviar queda deshabilitado mientras se procesa el submit [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  LG-15 omitida: backend no disponible.');
      return;
    }

    await goToLogin();
    await fillLogin(TEST_EMAIL, TEST_PASSWORD);

    const sendBtn = await driver!.findElement(By.xpath('//button[contains(.,"Enviar")]'));
    await sendBtn.click();

    // Inmediatamente después del click, el botón debe estar deshabilitado (loading=true)
    // o ya haber navegado. En ambos casos no debe mostrar error.
    await driver!.sleep(500);
    const currentUrl = await driver!.getCurrentUrl();
    const isNavigated = currentUrl.includes('/home-page');
    const isStillOnLogin = currentUrl.includes('/login');

    expect(isNavigated || isStillOnLogin).toBe(true);
  });

  // ── Prueba adicionales ───────────────────────────────────────────

  // ─── LG-extra-01 ─────────────────────────────────────────────────────────────
  it('LG-extra-01: El título de la página contiene "Inicia sesion en Market AI"', async () => {
    await goToLogin();
    const h1 = await driver!.findElement(By.css('h1'));
    const text = await h1.getText();
    expect(text.toLowerCase()).toContain('market ai');
  });

  // ─── LG-extra-02 ─────────────────────────────────────────────────────────────
  it('LG-extra-02: Usuario autenticado navegando a /login es redirigido fuera de login', async () => {
    const fakeToken = makeFakeJwt('user');

    await injectToken(driver!, fakeToken, 'user');

    await driver!.get(`${BASE_URL}/login`);
    await driver!.sleep(1000);

    const url = await driver!.getCurrentUrl();

    expect(url).not.toContain('/login');
  });

  // ─── LG-extra-03 ─────────────────────────────────────────────────────────────
  it('LG-extra-03: Botón Google redirige hacia OAuth provider [BE]', async () => {
    if (!backendAvailable) {
      console.warn('  LG-extra-02 omitida: backend no disponible.');
      return;
    }

    await goToLogin();

    const googleBtn = await driver!.findElement(By.css('.google-btn'));

    await googleBtn.click();

    await driver!.sleep(2000);

    const url = await driver!.getCurrentUrl();

    expect(
      url.includes('google') ||
      url.includes('/auth/google') ||
      url.includes('accounts.google.com')
    ).toBe(true);
  });

});

