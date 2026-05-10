// Tests E2E - Landing Page (LP-01 a LP-22)
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

    await driver.manage().window().setRect({ width: 1280, height: 800 });
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 8: El h1 del hero tiene texto no vacio - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el h1 del hero con texto no vacio', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const h1 = await driver.findElement(By.css('section.hero h1'));
    const text = await h1.getText();
    expect(text.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 9: El header es visible - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el header de la aplicacion en la pagina', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const headers = await driver.findElements(By.css('app-header'));
    expect(headers.length).toBeGreaterThan(0);
    if (headers.length > 0) {
      expect(await headers[0].isDisplayed()).toBe(true);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 10: Boton "Ver servicios" tiene texto correcto - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe existir el enlace Ver servicios con texto que contenga "servicios"', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const link = await driver.findElement(
      By.xpath('//a[contains(.,"Ver servicios")] | //button[contains(.,"Ver servicios")]')
    );
    const text = await link.getText();
    expect(text.toLowerCase()).toContain('servicios');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 11: Las 3 cards de caracteristicas tienen titulo visible - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar titulo visible en cada tarjeta de caracteristicas', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await driver.wait(until.elementLocated(By.css('.feature')), TIMEOUT);

    const features = await driver.findElements(By.css('.feature'));
    expect(features.length).toBe(3);

    for (const feature of features) {
      const headings = await feature.findElements(By.css('h2, h3, h4, strong, .title'));
      let hasTitle = false;
      for (const h of headings) {
        const text = await h.getText();
        if (text.length > 0) { hasTitle = true; break; }
      }
      expect(hasTitle).toBe(true);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 12: Las 3 cards de caracteristicas tienen descripcion visible - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar descripcion visible en cada tarjeta de caracteristicas', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await driver.wait(until.elementLocated(By.css('.feature')), TIMEOUT);

    const features = await driver.findElements(By.css('.feature'));
    expect(features.length).toBe(3);

    for (const feature of features) {
      const paras = await feature.findElements(By.css('p, span'));
      let hasDesc = false;
      for (const p of paras) {
        const text = await p.getText();
        if (text.length > 0) { hasDesc = true; break; }
      }
      expect(hasDesc).toBe(true);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 13: La seccion "Como funciona" es visible - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar la seccion Como funciona con al menos un paso visible', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await driver.wait(until.elementLocated(By.css('.step')), TIMEOUT);

    const firstStep = await driver.findElement(By.css('.step'));
    expect(await firstStep.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 14: La seccion CTA inferior tiene al menos un boton - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe existir al menos un boton o enlace en la seccion CTA inferior', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const ctaSection = await driver.findElement(By.css('section.cta'));
    const buttons = await ctaSection.findElements(By.css('button, a'));
    expect(buttons.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 15: El footer es visible - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el footer al final de la pagina', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const footers = await driver.findElements(By.css('app-footer, footer'));
    expect(footers.length).toBeGreaterThan(0);
    if (footers.length > 0) {
      expect(await footers[0].isDisplayed()).toBe(true);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 16: La URL raiz redirige a /landing-page - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe redirigir de la ruta raiz a /landing-page automaticamente', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/');
    await waitForUrl(driver, '/landing-page', NAV_TIMEOUT);
    expect(await driver.getCurrentUrl()).toContain('/landing-page');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 17: El titulo del documento no esta vacio - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el titulo del documento no vacio en /landing-page', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const title = await driver.getTitle();
    expect(title.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 18: Sin overflow horizontal en 1280px - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('No debe tener overflow horizontal en viewport de 1280 x 800', async () => {
    await clearToken(driver);
    await driver.manage().window().setRect({ width: 1280, height: 800 });
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const scrollWidth = await driver.executeScript('return document.documentElement.scrollWidth') as number;
    const clientWidth = await driver.executeScript('return document.documentElement.clientWidth') as number;
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 19: Responsive en tablet 768px - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('No debe tener overflow horizontal en viewport de tablet 768 x 1024', async () => {
    await clearToken(driver);
    await driver.manage().window().setRect({ width: 768, height: 1024 });
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const scrollWidth = await driver.executeScript('return document.documentElement.scrollWidth') as number;
    const clientWidth = await driver.executeScript('return document.documentElement.clientWidth') as number;
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);

    await driver.manage().window().setRect({ width: 1280, height: 800 });
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 20: El boton "Entrar al panel" sin sesion redirige a /login - no requiere backend
  // Nota: el boton es siempre visible; sin sesion navega a /login en lugar de /home-page
  // ──────────────────────────────────────────────────────────────
  it('Debe redirigir a /login al hacer clic en "Entrar al panel" sin sesion activa', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const panelBtn = await waitVisible(
      driver,
      By.xpath('//section[contains(@class,"hero")]//button[contains(.,"Entrar al panel")]')
    );
    await panelBtn.click();

    await waitForUrl(driver, '/login', NAV_TIMEOUT);
    expect(await driver.getCurrentUrl()).toContain('/login');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 21: Los botones del hero son elementos nativos accesibles - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener botones o enlaces nativos en el hero accesibles por teclado', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const heroBtns = await driver.findElements(
      By.xpath('//section[contains(@class,"hero")]//button | //section[contains(@class,"hero")]//a')
    );
    expect(heroBtns.length).toBeGreaterThan(0);

    for (const btn of heroBtns) {
      const tag = await btn.getTagName();
      expect(['button', 'a'].includes(tag)).toBe(true);
    }
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 22: La seccion hero tiene al menos 2 botones CTA - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe existir al menos 2 botones o enlaces CTA en la seccion hero', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/landing-page');
    await waitVisible(driver, By.css('section.hero'));

    const heroBtns = await driver.findElements(
      By.xpath('//section[contains(@class,"hero")]//button | //section[contains(@class,"hero")]//a')
    );
    expect(heroBtns.length).toBeGreaterThanOrEqual(2);
  });
});
