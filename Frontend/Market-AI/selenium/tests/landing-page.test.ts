/**
 * Landing Page — LP-01 a LP-07
 * Ruta: /landing-page (pública, sin backend)
 */
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  APP_URL,
  TIMEOUT,
  NAV_TIMEOUT,
  FAKE_USER_TOKEN,
  setToken,
  clearToken,
  waitVisible,
  waitForUrl,
  sleep,
} from '../helpers';

describe('Landing Page', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`\nNavegador detectado: ${browserUsed}\n`);
    // Ir al dominio para poder operar storage
    await driver.get(APP_URL + '/landing-page');
    await clearToken(driver);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // LP-01 · Carga correcta de la página
  // ───────────────────────────────────────────────────────────────────────────
  it('LP-01: La página carga correctamente y muestra el hero con título y botones CTA', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');

    // Espera el hero
    const hero = await waitVisible(driver, By.css('section.hero'));
    expect(await hero.isDisplayed()).toBe(true);

    // Título principal presente
    const h1 = await driver.findElement(By.css('section.hero h1'));
    const titleText = await h1.getText();
    expect(titleText.length).toBeGreaterThan(0);

    // Al menos un botón CTA en el hero
    const heroBtns = await driver.findElements(
      By.xpath('//section[contains(@class,"hero")]//button | //section[contains(@class,"hero")]//a[@mat-stroked-button or @mat-flat-button]')
    );
    expect(heroBtns.length).toBeGreaterThan(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // LP-02 · Botón "Entrar al panel" redirige a /home-page
  // ───────────────────────────────────────────────────────────────────────────
  it('LP-02: Con token válido, el botón "Entrar al panel" redirige a /home-page', async () => {
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/landing-page');

    const btn = await waitVisible(
      driver,
      By.xpath('//section[contains(@class,"hero")]//button[contains(.,"Entrar al panel")]')
    );
    await btn.click();

    await waitForUrl(driver, '/home-page', NAV_TIMEOUT);
    expect(await driver.getCurrentUrl()).toContain('/home-page');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // LP-03 · Botón "Ver servicios" hace scroll hacia la sección de servicios
  // ───────────────────────────────────────────────────────────────────────────
  it('LP-03: El botón "Ver servicios" hace scroll hacia la sección #servicios', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    // Scroll al inicio para partir desde 0
    await driver.executeScript('window.scrollTo(0, 0)');
    await sleep(300);

    const verServiciosLink = await driver.findElement(
      By.xpath('//a[contains(.,"Ver servicios")]')
    );
    await verServiciosLink.click();
    await sleep(800); // dar tiempo a la animación de scroll

    const scrollY = await driver.executeScript('return window.pageYOffset') as number;
    expect(scrollY).toBeGreaterThan(0);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // LP-04 · Sección de servicios contiene 3 tarjetas de características
  // ───────────────────────────────────────────────────────────────────────────
  it('LP-04: La sección de servicios muestra exactamente 3 tarjetas de características', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    // Espera que al menos una feature card esté en el DOM
    await driver.wait(
      until.elementLocated(By.css('.feature')),
      TIMEOUT
    );

    const featureCards = await driver.findElements(By.css('.feature'));
    expect(featureCards.length).toBe(3);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // LP-05 · Sección "Cómo funciona" muestra 3 pasos
  // ───────────────────────────────────────────────────────────────────────────
  it('LP-05: La sección "Cómo funciona" muestra exactamente 3 pasos (.step)', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    await driver.wait(until.elementLocated(By.css('.step')), TIMEOUT);

    const steps = await driver.findElements(By.css('.step'));
    expect(steps.length).toBe(3);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // LP-06 · Botón CTA inferior navega al dashboard (o a /login si no hay token)
  // ───────────────────────────────────────────────────────────────────────────
  it('LP-06: El botón CTA inferior redirige a /home-page o a /login según el estado de autenticación', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    // Busca el botón dentro de la sección .cta
    const ctaSection = await driver.findElement(By.css('section.cta'));
    const ctaBtn = await ctaSection.findElement(By.css('button'));
    await ctaBtn.click();

    // Sin token → guarda va a redirigir a /login
    await driver.wait(
      async () => {
        const url = await driver.getCurrentUrl();
        return url.includes('/home-page') || url.includes('/login');
      },
      NAV_TIMEOUT
    );

    const finalUrl = await driver.getCurrentUrl();
    expect(
      finalUrl.includes('/home-page') || finalUrl.includes('/login')
    ).toBe(true);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // LP-07 · La página es responsive en viewport móvil (375 × 667)
  // ───────────────────────────────────────────────────────────────────────────
  it('LP-07: La página no tiene overflow horizontal en viewport móvil de 375 × 667', async () => {
    await clearToken(driver);

    // Redimensionar a resolución móvil
    await driver.manage().window().setRect({ width: 375, height: 667 });
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    // Verificar que el contenido no desborda horizontalmente
    const scrollWidth  = await driver.executeScript('return document.documentElement.scrollWidth') as number;
    const clientWidth  = await driver.executeScript('return document.documentElement.clientWidth') as number;

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // ±5 px de tolerancia

    // Restaurar tamaño de ventana normal
    await driver.manage().window().setRect({ width: 1280, height: 800 });
  });
});
