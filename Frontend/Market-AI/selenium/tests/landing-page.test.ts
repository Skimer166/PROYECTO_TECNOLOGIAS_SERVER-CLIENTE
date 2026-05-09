// Tests E2E — Landing Page (LP-01 a LP-07)
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  APP_URL,
  TIMEOUT,
  NAV_TIMEOUT,
  setToken,
  clearToken,
  waitVisible,
  waitForUrl,
  sleep,
} from '../helpers';

const BACKEND_URL  = process.env['BACKEND_URL']   ?? 'https://market-ai-api.onrender.com';
const USER_EMAIL   = process.env['USER_EMAIL']    ?? '';
const USER_PASSWORD = process.env['USER_PASSWORD'] ?? '';

// Hace login real contra el backend y devuelve el token JWT
async function loginAndGetToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

describe('Landing Page (E2E)', () => {
  let driver: WebDriver;
  let backendAvailable = false;
  let credentialsAvailable = false;

  beforeAll(async () => {
    // Verificar si el backend está disponible
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch(`${BACKEND_URL}/auth/login`, { signal: controller.signal });
      clearTimeout(timeoutId);
      backendAvailable = true;
    } catch {
      backendAvailable = false;
    }

    credentialsAvailable = backendAvailable && !!USER_EMAIL && !!USER_PASSWORD;

    if (!backendAvailable) {
      console.warn('\nBackend no disponible. Las pruebas que requieren backend serán omitidas.\n');
    } else if (!credentialsAvailable) {
      console.warn('\nCredenciales no configuradas (USER_EMAIL / USER_PASSWORD). Las pruebas que requieren autenticación serán omitidas.\n');
    } else {
      console.log(`\nBackend disponible en ${BACKEND_URL}\n`);
    }

    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`Navegador detectado: ${browserUsed}\n`);
    await driver.get(APP_URL + '/landing-page');
    await clearToken(driver);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 1: La página carga correctamente — no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe cargar la página y mostrar el hero con título y botones CTA', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');

    const hero = await waitVisible(driver, By.css('section.hero'));
    expect(await hero.isDisplayed()).toBe(true);

    const h1 = await driver.findElement(By.css('section.hero h1'));
    const titleText = await h1.getText();
    expect(titleText.length).toBeGreaterThan(0);

    const heroBtns = await driver.findElements(
      By.xpath('//section[contains(@class,"hero")]//button | //section[contains(@class,"hero")]//a[@mat-stroked-button or @mat-flat-button]')
    );
    expect(heroBtns.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 2: Botón "Entrar al panel" redirige — requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe redirigir a /home-page al hacer clic en "Entrar al panel" con sesión activa', async () => {
    if (!credentialsAvailable) {
      console.warn('  Prueba omitida: credenciales de usuario no disponibles (USER_EMAIL / USER_PASSWORD).');
      return;
    }

    const token = await loginAndGetToken();
    if (!token) {
      console.warn('  Prueba omitida: no se pudo obtener token del backend.');
      return;
    }

    await setToken(driver, token);
    await driver.get(APP_URL + '/landing-page');

    const btn = await waitVisible(
      driver,
      By.xpath('//section[contains(@class,"hero")]//button[contains(.,"Entrar al panel")]')
    );
    await btn.click();

    await waitForUrl(driver, '/home-page', NAV_TIMEOUT);
    expect(await driver.getCurrentUrl()).toContain('/home-page');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 3: Scroll hacia servicios — no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe hacer scroll hacia la sección #servicios al hacer clic en "Ver servicios"', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    await driver.executeScript('window.scrollTo(0, 0)');
    await sleep(300);

    const verServiciosLink = await driver.findElement(
      By.xpath('//a[contains(.,"Ver servicios")]')
    );
    await verServiciosLink.click();
    await sleep(800);

    const scrollY = await driver.executeScript('return window.pageYOffset') as number;
    expect(scrollY).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 4: 3 tarjetas en servicios — no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar exactamente 3 tarjetas de características en la sección de servicios', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    await driver.wait(until.elementLocated(By.css('.feature')), TIMEOUT);

    const featureCards = await driver.findElements(By.css('.feature'));
    expect(featureCards.length).toBe(3);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 5: 3 pasos en "Cómo funciona" — no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar exactamente 3 pasos en la sección "Cómo funciona"', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    await driver.wait(until.elementLocated(By.css('.step')), TIMEOUT);

    const steps = await driver.findElements(By.css('.step'));
    expect(steps.length).toBe(3);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 6: Botón CTA inferior navega — no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe redirigir a /home-page o /login al hacer clic en el botón CTA inferior', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const ctaSection = await driver.findElement(By.css('section.cta'));
    const ctaBtn = await ctaSection.findElement(By.css('button'));
    await ctaBtn.click();

    await driver.wait(
      async () => {
        const url = await driver.getCurrentUrl();
        return url.includes('/home-page') || url.includes('/login');
      },
      NAV_TIMEOUT
    );

    const finalUrl = await driver.getCurrentUrl();
    expect(finalUrl.includes('/home-page') || finalUrl.includes('/login')).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 7: Responsive en móvil — no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('No debe tener overflow horizontal en viewport móvil de 375 × 667', async () => {
    await clearToken(driver);

    await driver.manage().window().setRect({ width: 375, height: 667 });
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const scrollWidth = await driver.executeScript('return document.documentElement.scrollWidth') as number;
    const clientWidth = await driver.executeScript('return document.documentElement.clientWidth') as number;

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);

    // Restaurar ventana normal
    await driver.manage().window().setRect({ width: 1280, height: 800 });
  });
});
