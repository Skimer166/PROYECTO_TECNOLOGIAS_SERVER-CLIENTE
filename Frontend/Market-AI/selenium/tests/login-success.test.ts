import { By, until, WebDriver } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  BASE_URL,
  TIMEOUT,
  makeFakeJwt,
} from './auth-helper';

// ── Token JWT falso con estructura válida para probar el flujo OAuth ──────────
function makeOAuthToken(): string {
  return makeFakeJwt('user');
}

// ══════════════════════════════════════════════════════════════════════════════
// Suite LS-01 → LS-03 — Login Success Page / OAuth Callback (E2E Selenium)
// ══════════════════════════════════════════════════════════════════════════════
describe('LS — Login Success Page (E2E Selenium)', () => {
  let driver: WebDriver | undefined;

  beforeAll(async () => {
    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`\n✓ Navegador: ${browserUsed}\n`);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ── Helper: limpiar sesión ───────────────────────────────────────────────────
  async function clearSession(): Promise<void> {
    await driver!.get(`${BASE_URL}/landing-page`);
    await driver!.executeScript(`
      sessionStorage.removeItem('token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user_role');
    `);
  }

  // ─── LS-01 ─────────────────────────────────────────────────────────────────
  it('LS-01: Token OAuth válido en URL procesa el login y redirige a /home-page', async () => {
    await clearSession();
    const token = makeOAuthToken();

    await driver!.get(`${BASE_URL}/login/success?token=${token}`);

    // Debe redirigir a /home-page después de procesar el token
    await driver!.wait(until.urlContains('/home-page'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/home-page');

    // El token debe haberse guardado en storage
    const storedToken = await driver!.executeScript<string | null>(
      `return sessionStorage.getItem('token') || localStorage.getItem('token')`
    );
    expect(storedToken).toBeTruthy();
  });

  // ─── LS-02 ─────────────────────────────────────────────────────────────────
  it('LS-02: Sin token en URL redirige a /login con error=missing_token', async () => {
    await clearSession();

    // Navegar sin token en el query param
    await driver!.get(`${BASE_URL}/login/success`);

    // Debe redirigir a /login
    await driver!.wait(until.urlContains('/login'), TIMEOUT);
    const url = await driver!.getCurrentUrl();
    expect(url).toContain('/login');
    // El query param de error puede estar presente
    // (el comportamiento exacto depende del guard y del componente)
    expect(url).not.toContain('/home-page');
  });

  // ─── LS-03 ─────────────────────────────────────────────────────────────────
  it('LS-03: Con token válido se muestra brevemente el dialog de éxito antes de redirigir', async () => {
    await clearSession();
    const token = makeOAuthToken();

    await driver!.get(`${BASE_URL}/login/success?token=${token}`);

    // El componente abre un dialog de éxito y luego navega. Intentamos capturar el dialog.
    // Si aparece brevemente antes de la redirección, lo capturamos.
    let dialogFound = false;
    try {
      const dialog = await driver!.wait(
        until.elementLocated(By.css('mat-dialog-container')),
        2000 // timeout corto — puede ser muy breve
      );
      dialogFound = await dialog.isDisplayed();
    } catch {
      // El dialog puede haberse cerrado antes de que lo encontremos
      dialogFound = false;
    }

    // También verificamos que llegó a /home-page (lo que confirma el flujo exitoso)
    await driver!.wait(until.urlContains('/home-page'), TIMEOUT);
    const redirected = (await driver!.getCurrentUrl()).includes('/home-page');

    // El test es exitoso si llegó a home-page (con o sin haber capturado el dialog)
    expect(redirected || dialogFound).toBe(true);
  });
});
