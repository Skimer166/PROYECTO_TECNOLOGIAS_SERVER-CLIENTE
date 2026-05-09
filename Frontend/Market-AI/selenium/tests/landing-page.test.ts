// Tests E2E - Landing Page (LP-01 a LP-07)
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

describe('Landing Page (E2E)', () => {
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

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 1: La pagina carga correctamente - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe cargar la pagina y mostrar el hero con titulo y botones CTA', async () => {
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
  // PRUEBA 2: Boton "Entrar al panel" redirige - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe redirigir a /home-page al hacer clic en "Entrar al panel" con sesion activa', async () => {
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

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 3: Scroll hacia servicios - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe hacer scroll hacia la seccion #servicios al hacer clic en "Ver servicios"', async () => {
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
  // PRUEBA 4: 3 tarjetas en servicios - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar exactamente 3 tarjetas de caracteristicas en la seccion de servicios', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    await driver.wait(until.elementLocated(By.css('.feature')), TIMEOUT);

    const featureCards = await driver.findElements(By.css('.feature'));
    expect(featureCards.length).toBe(3);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 5: 3 pasos en "Como funciona" - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar exactamente 3 pasos en la seccion "Como funciona"', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    await driver.wait(until.elementLocated(By.css('.step')), TIMEOUT);

    const steps = await driver.findElements(By.css('.step'));
    expect(steps.length).toBe(3);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 6: Boton CTA inferior navega - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe redirigir a /home-page o /login al hacer clic en el boton CTA inferior', async () => {
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
  // PRUEBA 7: Responsive en movil - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('No debe tener overflow horizontal en viewport movil de 375 x 667', async () => {
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
