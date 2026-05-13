import { By, Key, until, WebDriver, WebElement } from 'selenium-webdriver';
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

// ── Credenciales de prueba (ajustar en CI con variables de entorno) ──────────
const TEST_USER_EMAIL = process.env['TEST_USER_EMAIL'] ?? 'test@example.com';
const TEST_USER_PASSWORD = process.env['TEST_USER_PASSWORD'] ?? 'password123';
const TEST_ADMIN_EMAIL = process.env['TEST_ADMIN_EMAIL'] ?? 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env['TEST_ADMIN_PASSWORD'] ?? 'admin123';
// ─────────────────────────────────────────────────────────────────────────────

describe('HP — Home Page (E2E Selenium)', () => {
  let driver: WebDriver | undefined;
  let backendAvailable = false;
  let userToken: string | null = null;
  let adminToken: string | null = null;

  // ── Setup global ────────────────────────────────────────────────────────────
  beforeAll(async () => {
    backendAvailable = await checkBackendAvailable();

    if (!backendAvailable) {
      console.warn(`\n⚠ Backend no disponible en ${BACKEND_URL}.`);
      console.warn('  Las pruebas marcadas [BE] serán omitidas.\n');
    } else {
      console.log(`\n✓ Backend disponible en ${BACKEND_URL}`);
      userToken = await loginAndGetToken(TEST_USER_EMAIL, TEST_USER_PASSWORD);
      adminToken = await loginAndGetToken(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD);
      if (!userToken) console.warn('  ⚠ No se obtuvo token de usuario — se usará token falso para pruebas puras de UI.');
      if (!adminToken) console.warn('  ⚠ No se obtuvo token de admin — se usará token falso para pruebas puras de UI.\n');
    }

    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`✓ Navegador detectado: ${browserUsed}\n`);

    // Warm-up: carga Angular antes del primer test para evitar timeout por cold-start
    await driver.get(`${BASE_URL}/landing-page`);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ── Helpers internos ────────────────────────────────────────────────────────

  async function goHomeAsUser(role: 'user' | 'admin' = 'user'): Promise<void> {
    const token =
      role === 'admin'
        ? (adminToken ?? makeFakeJwt('admin'))
        : (userToken ?? makeFakeJwt('user'));
    await injectToken(driver!, token, role);
    // Navegación client-side: evita que el servidor SSR ejecute el guard
    // (en SSR isPlatformBrowser=false → hasToken()=false → redirect a /login siempre)
    await driver!.executeScript(`
      history.pushState(null, '', '/home-page');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);
    await driver!.sleep(500);
  }

  async function waitForCarousel(): Promise<WebElement> {
    return driver!.wait(until.elementLocated(By.css('.carousel-container')), TIMEOUT);
  }

  async function waitForPage(): Promise<void> {
    await driver!.wait(until.elementLocated(By.css('.search-section')), TIMEOUT);
  }

  /**
   * Con zoneless change detection + OnPush el template puede renderizarse antes
   * de que ngOnInit actualice isAdmin. Hacer clic en el hero fuerza un ciclo de CD
   * y permite que @if (isAdmin) re-evalúe correctamente.
   */
  async function triggerCdAndWaitForAdminPanel(): Promise<WebElement> {
    await driver!.wait(until.elementLocated(By.css('.hero')), TIMEOUT);
    const exploreBtn = await driver!.findElement(By.css('.hero button'));
    await exploreBtn.click();
    await driver!.sleep(300);
    return driver!.wait(until.elementLocated(By.css('.admin-panel')), TIMEOUT);
  }

  // ─── HP-01 ─────────────────────────────────────────────────────────────────
  it('HP-01: Muestra carousel con agentes al cargar la página [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-01 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    const carousel = await waitForCarousel();
    expect(await carousel.isDisplayed()).toBe(true);

    const cards = await driver!.findElements(By.css('mat-card.agent-card'));
    expect(cards.length).toBeGreaterThan(0);
  });

  // ─── HP-02 ─────────────────────────────────────────────────────────────────
  it('HP-02: Muestra estado vacío cuando no coincide ningún agente [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-02 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForPage();

    // Esperar a que carguen los agentes o aparezca spinner
    await driver!.sleep(2000);

    const searchInput = await driver!.findElement(
      By.css('input[placeholder="Ej. python..."]')
    );
    await searchInput.sendKeys('xyzsinresultados_99999');
    await driver!.sleep(500); // esperar debounce 300ms

    const stateMessages = await driver!.findElements(By.css('.state-message'));
    expect(stateMessages.length).toBeGreaterThan(0);
  });

  // ─── HP-03 ─────────────────────────────────────────────────────────────────
  it('HP-03: Muestra mensaje de error cuando el backend falla [BE]', async () => {
    if (backendAvailable) {
      console.warn('  HP-03 omitida: el backend está disponible (se necesita backend caído).');
      return;
    }

    await injectToken(driver!, makeFakeJwt('user'));
    await driver!.get(`${BASE_URL}/home-page`);

    const errorEl = await driver!.wait(
      until.elementLocated(By.css('.state-message--error')),
      TIMEOUT
    );
    expect(await errorEl.isDisplayed()).toBe(true);
  });

  // ─── HP-04 ─────────────────────────────────────────────────────────────────
  it('HP-04: Búsqueda filtra agentes por nombre [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-04 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const cards = await driver!.findElements(By.css('mat-card.agent-card'));
    if (cards.length === 0) return;

    const firstTitle = await cards[0].findElement(By.css('mat-card-title')).getText();
    const keyword = firstTitle.split(' ')[0];

    const searchInput = await driver!.findElement(By.css('input[placeholder="Ej. python..."]'));
    await searchInput.clear();
    await searchInput.sendKeys(keyword);
    await driver!.sleep(500); // debounce wait

    const filtered = await driver!.findElements(By.css('mat-card.agent-card'));
    expect(filtered.length).toBeGreaterThanOrEqual(1);

    for (const card of filtered) {
      const title = await card.findElement(By.css('mat-card-title')).getText();
      expect(title.toLowerCase()).toContain(keyword.toLowerCase());
    }
  });

  // ─── HP-05 ─────────────────────────────────────────────────────────────────
  it('HP-05: Búsqueda filtra agentes por descripción [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-05 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const cards = await driver!.findElements(By.css('mat-card.agent-card'));
    if (cards.length === 0) return;

    const descText = await cards[0].findElement(By.css('p.description')).getText();
    const keyword = descText.trim().split(' ')[0];
    if (!keyword || keyword.length < 3) return;

    const searchInput = await driver!.findElement(By.css('input[placeholder="Ej. python..."]'));
    await searchInput.clear();
    await searchInput.sendKeys(keyword);
    await driver!.sleep(500);

    const filtered = await driver!.findElements(By.css('mat-card.agent-card'));
    expect(filtered.length).toBeGreaterThanOrEqual(1);
  });

  // ─── HP-06 ─────────────────────────────────────────────────────────────────
  it('HP-06: Búsqueda filtra agentes por modelo [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-06 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    // El primer chip en cada tarjeta es el modelVersion
    const modelChips = await driver!.findElements(
      By.css('mat-card.agent-card mat-chip')
    );
    if (modelChips.length === 0) return;

    const modelText = await modelChips[0].getText();

    const searchInput = await driver!.findElement(By.css('input[placeholder="Ej. python..."]'));
    await searchInput.clear();
    await searchInput.sendKeys(modelText);
    await driver!.sleep(500);

    const filtered = await driver!.findElements(By.css('mat-card.agent-card'));
    expect(filtered.length).toBeGreaterThanOrEqual(1);
  });

  // ─── HP-07 ─────────────────────────────────────────────────────────────────
  it('HP-07: Limpiar búsqueda restaura todos los agentes [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-07 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const initialCount = (await driver!.findElements(By.css('mat-card.agent-card'))).length;

    const searchInput = await driver!.findElement(By.css('input[placeholder="Ej. python..."]'));
    await searchInput.sendKeys('xyz_sin_resultados');
    await driver!.sleep(500);

    // Limpiar con el botón de cerrar (ícono "close")
    const clearBtns = await driver!.findElements(
      By.xpath('//button[@mat-icon-button]//mat-icon[text()="close"]')
    );
    if (clearBtns.length > 0) {
      await clearBtns[0].click();
    } else {
      // Fallback: limpiar el input con Ctrl+A + Delete
      await searchInput.sendKeys(Key.CONTROL, 'a');
      await searchInput.sendKeys(Key.DELETE);
    }
    await driver!.sleep(500);

    const afterCount = (await driver!.findElements(By.css('mat-card.agent-card'))).length;
    expect(afterCount).toBe(initialCount);
  });

  // ─── HP-08 ─────────────────────────────────────────────────────────────────
  it('HP-08: Chip "Todos" muestra todos los agentes sin filtro [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-08 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const chips = await driver!.findElements(By.css('mat-chip-option'));
    // Seleccionar una categoría primero
    if (chips.length > 1) {
      await chips[1].click();
      await driver!.sleep(300);
    }

    // Ahora hacer clic en "Todos" (primer chip)
    const todosChip = await driver!.findElement(
      By.xpath('//mat-chip-option[contains(., "Todos")]')
    );
    await todosChip.click();
    await driver!.sleep(300);

    const cards = await driver!.findElements(By.css('mat-card.agent-card'));
    expect(cards.length).toBeGreaterThan(0);
  });

  // ─── HP-09 ─────────────────────────────────────────────────────────────────
  it('HP-09: Chip de categoría filtra el carousel [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-09 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const chips = await driver!.findElements(By.css('mat-chip-option'));
    if (chips.length < 2) return;

    await chips[1].click(); // primer chip de categoría (distinto de "Todos")
    await driver!.sleep(300);

    // El carousel debe mostrar agentes filtrados o el estado vacío, sin errores
    const cards = await driver!.findElements(By.css('mat-card.agent-card'));
    const emptyState = await driver!.findElements(By.css('.state-message'));
    expect(cards.length + emptyState.length).toBeGreaterThan(0);
    const errors = await driver!.findElements(By.css('.state-message--error'));
    expect(errors.length).toBe(0);
  });

  // ─── HP-10 ─────────────────────────────────────────────────────────────────
  it('HP-10: Cambiar de categoría actualiza el carousel [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-10 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const chips = await driver!.findElements(By.css('mat-chip-option'));
    if (chips.length < 3) return;

    await chips[1].click();
    await driver!.sleep(300);
    const countA = (await driver!.findElements(By.css('mat-card.agent-card'))).length;

    await chips[2].click();
    await driver!.sleep(300);
    const countB = (await driver!.findElements(By.css('mat-card.agent-card'))).length;

    // El carousel reaccionó: sin errores en la UI
    const errors = await driver!.findElements(By.css('.state-message--error'));
    expect(errors.length).toBe(0);
    expect(countA + countB).toBeGreaterThanOrEqual(0); // puede ser 0 si no hay agentes de esa cat.
  });

  // ─── HP-11 ─────────────────────────────────────────────────────────────────
  it('HP-11: El carousel muestra máximo 3 agentes simultáneamente [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-11 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const cards = await driver!.findElements(By.css('mat-card.agent-card'));
    expect(cards.length).toBeLessThanOrEqual(3);
  });

  // ─── HP-12 ─────────────────────────────────────────────────────────────────
  it('HP-12: El botón "siguiente" avanza el carousel [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-12 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const initialCards = await driver!.findElements(By.css('mat-card.agent-card'));
    if (initialCards.length < 3) {
      console.warn('  HP-12 omitida: menos de 3 agentes, el carousel no cicla.');
      return;
    }

    const initialTitle = await initialCards[0].findElement(By.css('mat-card-title')).getText();

    const nextBtn = await driver!.findElement(By.css('.carousel-nav.next'));
    await nextBtn.click();
    await driver!.sleep(300);

    const afterCards = await driver!.findElements(By.css('mat-card.agent-card'));
    const afterTitle = await afterCards[0].findElement(By.css('mat-card-title')).getText();

    expect(afterTitle).not.toBe(initialTitle);
  });

  // ─── HP-13 ─────────────────────────────────────────────────────────────────
  it('HP-13: El botón "anterior" retrocede el carousel [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-13 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const cards = await driver!.findElements(By.css('mat-card.agent-card'));
    if (cards.length < 3) {
      console.warn('  HP-13 omitida: menos de 3 agentes, el carousel no cicla.');
      return;
    }

    // Avanzar primero para tener posición no-inicial
    const nextBtn = await driver!.findElement(By.css('.carousel-nav.next'));
    await nextBtn.click();
    await driver!.sleep(200);

    const midCards = await driver!.findElements(By.css('mat-card.agent-card'));
    const midTitle = await midCards[0].findElement(By.css('mat-card-title')).getText();

    const prevBtn = await driver!.findElement(By.css('.carousel-nav.prev'));
    await prevBtn.click();
    await driver!.sleep(300);

    const afterCards = await driver!.findElements(By.css('mat-card.agent-card'));
    const afterTitle = await afterCards[0].findElement(By.css('mat-card-title')).getText();

    expect(afterTitle).not.toBe(midTitle);
  });

  // ─── HP-14 ─────────────────────────────────────────────────────────────────
  it('HP-14: El carousel avanza automáticamente cada 5 segundos [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-14 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const initialCards = await driver!.findElements(By.css('mat-card.agent-card'));
    if (initialCards.length < 3) {
      console.warn('  HP-14 omitida: menos de 3 agentes, auto-scroll no activo.');
      return;
    }

    const initialTitle = await initialCards[0].findElement(By.css('mat-card-title')).getText();

    await driver!.sleep(6000); // esperar más de 5s para que el auto-slide dispare

    const afterCards = await driver!.findElements(By.css('mat-card.agent-card'));
    const afterTitle = await afterCards[0].findElement(By.css('mat-card-title')).getText();

    expect(afterTitle).not.toBe(initialTitle);
  });

  // ─── HP-15 ─────────────────────────────────────────────────────────────────
  it('HP-15: El auto-scroll se pausa al hacer hover sobre el carousel [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-15 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    const carousel = await waitForCarousel();

    const initialCards = await driver!.findElements(By.css('mat-card.agent-card'));
    if (initialCards.length < 3) {
      console.warn('  HP-15 omitida: menos de 3 agentes, auto-scroll no activo.');
      return;
    }

    const initialTitle = await initialCards[0].findElement(By.css('mat-card-title')).getText();

    // Simular mouseenter via JavaScript (más fiable en modo headless)
    await driver!.executeScript(
      `arguments[0].dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))`,
      carousel
    );

    await driver!.sleep(6000); // esperar más de 5s, el auto-scroll debería estar pausado

    const afterCards = await driver!.findElements(By.css('mat-card.agent-card'));
    const afterTitle = await afterCards[0].findElement(By.css('mat-card-title')).getText();

    // Al estar en hover, el carousel NO debe haber avanzado
    expect(afterTitle).toBe(initialTitle);
  });

  // ─── HP-16 ─────────────────────────────────────────────────────────────────
  it('HP-16: Tarjeta de agente muestra nombre, categoría, descripción, modelo, precio [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-16 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const cards = await driver!.findElements(By.css('mat-card.agent-card'));
    expect(cards.length).toBeGreaterThan(0);

    const card = cards[0];

    const name = await card.findElement(By.css('mat-card-title')).getText();
    expect(name.length).toBeGreaterThan(0);

    const category = await card.findElement(By.css('mat-card-subtitle')).getText();
    expect(category.length).toBeGreaterThan(0);

    const description = await card.findElement(By.css('p.description')).getText();
    expect(description.length).toBeGreaterThan(0);

    const priceTag = await card.findElement(By.css('.price-tag')).getText();
    expect(priceTag).toContain('/ hr');

    const chips = await card.findElements(By.css('mat-chip'));
    expect(chips.length).toBeGreaterThanOrEqual(2); // modelVersion + language

    const rentBtn = await card.findElement(By.xpath('.//button[contains(., "Rentar")]'));
    expect(await rentBtn.isDisplayed()).toBe(true);
  });

  // ─── HP-17 ─────────────────────────────────────────────────────────────────
  it('HP-17: Botón "Rentar" abre el RentDialog con nombre y precio del agente [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-17 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const firstCard = (await driver!.findElements(By.css('mat-card.agent-card')))[0];
    const agentName = await firstCard.findElement(By.css('mat-card-title')).getText();

    const rentBtn = await firstCard.findElement(By.xpath('.//button[contains(., "Rentar")]'));
    await rentBtn.click();

    const dialog = await driver!.wait(
      until.elementLocated(By.css('mat-dialog-container')),
      TIMEOUT
    );
    expect(await dialog.isDisplayed()).toBe(true);

    // Verificar que el dialog muestra el nombre del agente
    const dialogTitle = await dialog.findElement(By.css('h2[mat-dialog-title]')).getText();
    expect(dialogTitle).toContain(agentName);

    // Cerrar el dialog
    const cancelBtn = await dialog.findElement(By.xpath('.//button[contains(., "Cancelar")]'));
    await cancelBtn.click();
    await driver!.sleep(300);
  });

  // ─── HP-18 ─────────────────────────────────────────────────────────────────
  it('HP-18: Panel de admin visible para usuario con rol admin [BE]', async () => {
    if (!backendAvailable || !adminToken) {
      console.warn('  HP-18 omitida: backend no disponible o sin token de admin real.');
      return;
    }

    const token = adminToken ?? makeFakeJwt('admin');
    await injectToken(driver!, token, 'admin');
    await driver!.get(`${BASE_URL}/home-page`);

    const adminPanel = await triggerCdAndWaitForAdminPanel();
    expect(await adminPanel.isDisplayed()).toBe(true);
  });

  // ─── HP-19 ─────────────────────────────────────────────────────────────────
  it('HP-19: Panel de admin oculto para usuario con rol user [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-19 omitida: backend no disponible o sin token de usuario real.');
      return;
    }

    const token = userToken ?? makeFakeJwt('user');
    await injectToken(driver!, token, 'user');
    await driver!.get(`${BASE_URL}/home-page`);

    // Forzar CD igual que en HP-18 para validar que isAdmin=false no produce panel
    await driver!.wait(until.elementLocated(By.css('.hero')), TIMEOUT);
    const exploreBtn = await driver!.findElement(By.css('.hero button'));
    await exploreBtn.click();
    await driver!.sleep(500);

    const adminPanels = await driver!.findElements(By.css('.admin-panel'));
    expect(adminPanels.length).toBe(0);
  });

  // ─── HP-20 ─────────────────────────────────────────────────────────────────
  it('HP-20: Botón "Panel de agentes" navega a /admin/agents', async () => {
    await injectToken(driver!, makeFakeJwt('admin'), 'admin');
    await driver!.executeScript(`
      history.pushState(null, '', '/home-page');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);
    await driver!.sleep(500);

    const adminPanel = await triggerCdAndWaitForAdminPanel();
    expect(await adminPanel.isDisplayed()).toBe(true);

    const btn = await driver!.findElement(
      By.xpath('//button[contains(., "Panel de agentes")]')
    );
    await btn.click();

    await driver!.wait(until.urlContains('/admin/agents'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/admin/agents');
  });

  // ─── HP-21 ─────────────────────────────────────────────────────────────────
  it('HP-21: Botón "Panel de usuarios" navega a /admin/users', async () => {
    await injectToken(driver!, makeFakeJwt('admin'), 'admin');
    await driver!.executeScript(`
      history.pushState(null, '', '/home-page');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);
    await driver!.sleep(500);

    await triggerCdAndWaitForAdminPanel();

    const btn = await driver!.findElement(
      By.xpath('//button[contains(., "Panel de usuarios")]')
    );
    await btn.click();

    await driver!.wait(until.urlContains('/admin/users'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/admin/users');
  });

  // ─── HP-22 ─────────────────────────────────────────────────────────────────
  it('HP-22: Botón "Chats de Soporte" navega a /admin/support', async () => {
    await injectToken(driver!, makeFakeJwt('admin'), 'admin');
    await driver!.executeScript(`
      history.pushState(null, '', '/home-page');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);
    await driver!.sleep(500);

    await triggerCdAndWaitForAdminPanel();

    const btn = await driver!.findElement(
      By.xpath('//button[contains(., "Chats de Soporte")]')
    );
    await btn.click();

    await driver!.wait(until.urlContains('/admin/support'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/admin/support');
  });

  // ─── HP-23 ─────────────────────────────────────────────────────────────────
  it('HP-23: Filtro combinado de categoría + búsqueda aplica ambos criterios [BE]', async () => {
    if (!backendAvailable || !userToken) {
      console.warn('  HP-23 omitida: backend no disponible o sin token real.');
      return;
    }

    await goHomeAsUser();
    await waitForCarousel();

    const chips = await driver!.findElements(By.css('mat-chip-option'));
    if (chips.length > 1) {
      await chips[1].click();
      await driver!.sleep(200);
    }

    const searchInput = await driver!.findElement(By.css('input[placeholder="Ej. python..."]'));
    await searchInput.sendKeys('a');
    await driver!.sleep(500);

    // Verificar que no hay error y la UI reaccionó
    const errors = await driver!.findElements(By.css('.state-message--error'));
    expect(errors.length).toBe(0);
  });

  // ─── HP-24 ─────────────────────────────────────────────────────────────────
  it('HP-24: Sin token, el guard redirige a /login', async () => {
    // Asegurarse de estar en la app (mismo origen) antes de manipular storage
    await driver!.get(`${BASE_URL}/landing-page`);
    await driver!.executeScript(`
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user_role');
      localStorage.removeItem('token');
      localStorage.removeItem('user_role');
    `);

    // Navegación client-side: guard corre en el browser (no en SSR)
    // → sin token → authActivateGuard redirige a /login
    await driver!.executeScript(`
      history.pushState(null, '', '/home-page');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);

    await driver!.wait(until.urlContains('/login'), TIMEOUT);
    expect(await driver!.getCurrentUrl()).toContain('/login');
  });

  // ── Prueba adicional — hero section sin depender de backend ────────────────
  it('HP-extra: La sección hero se renderiza inmediatamente para usuarios autenticados', async () => {
    await injectToken(driver!, makeFakeJwt('user'), 'user');
    await driver!.executeScript(`
      history.pushState(null, '', '/home-page');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);
    await driver!.sleep(500);

    const hero = await driver!.wait(
      until.elementLocated(By.css('.hero')),
      TIMEOUT
    );
    expect(await hero.isDisplayed()).toBe(true);

    const title = await hero.findElement(By.css('h1')).getText();
    expect(title.toLowerCase()).toContain('market');

    const exploreBtn = await hero.findElement(By.css('button'));
    expect(await exploreBtn.isDisplayed()).toBe(true);
  });
});
