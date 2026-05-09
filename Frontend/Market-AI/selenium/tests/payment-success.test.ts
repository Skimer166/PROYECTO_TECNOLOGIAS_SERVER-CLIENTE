// Tests E2E - Payment Success (PS-01 a PS-07)
import { WebDriver, By } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  APP_URL,
  NAV_TIMEOUT,
  FAKE_USER_TOKEN,
  setToken,
  clearToken,
  waitVisible,
  waitForUrl,
  sleep,
} from '../helpers';

const BACKEND_URL = process.env['BACKEND_URL'] || 'http://localhost:3001';

describe('Payment Success (E2E)', () => {
  let driver: WebDriver;
  let backendAvailable = false;

  beforeAll(async () => {
    const { driver: d, browserUsed } = await createDriver();
    driver = d;
    console.log(`Navegador detectado: ${browserUsed}\n`);

    try {
      const res = await fetch(`${BACKEND_URL}/agents`);
      backendAvailable = res.status < 500;
    } catch {
      backendAvailable = false;
    }
    console.log(`Backend disponible: ${backendAvailable}\n`);

    await driver.get(APP_URL + '/landing-page');
    await clearToken(driver);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 1: Sin sesion activa redirige a /login - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe redirigir a /login al navegar a /payment/success sin token', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/payment/success');
    await waitForUrl(driver, '/login', NAV_TIMEOUT);
    expect(await driver.getCurrentUrl()).toContain('/login');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 2: Sin session_id muestra div de error - no requiere backend
  // La logica es puramente frontend: ngOnInit detecta la ausencia y
  // pone verifying=false y error="No se encontro informacion del pago"
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el div de error cuando no hay session_id en la URL', async () => {
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/payment/success');
    await sleep(2000);

    const errorDiv = await waitVisible(driver, By.css('.error'));
    expect(await errorDiv.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 3: Sin session_id el mensaje de error es el esperado - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el mensaje de pago no encontrado cuando falta session_id', async () => {
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/payment/success');
    await sleep(2000);

    const errorDiv = await waitVisible(driver, By.css('.error'));
    const errorText = await errorDiv.getText();
    expect(errorText).toContain('No se encontr');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 4: Con session_id invalido y backend ON muestra error de verificacion [BE]
  // El token falso hace que el backend rechace la solicitud de verificacion
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar error de verificacion al enviar un session_id invalido', async () => {
    if (!backendAvailable) { console.warn('SKIP PS-04: backend no disponible'); return; }
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/payment/success?session_id=invalid_test_abc123');
    await sleep(4000);

    const errorDiv = await waitVisible(driver, By.css('.error'));
    const errorText = await errorDiv.getText();
    expect(errorText.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 5: Boton Volver en estado error navega a /home-page - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe navegar a /home-page al hacer clic en Volver desde el estado de error', async () => {
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/payment/success');
    await sleep(2000);

    await waitVisible(driver, By.css('.error'));
    const backBtn = await driver.findElement(By.css('.error button'));
    await backBtn.click();

    // Aceptar /home-page o /landing-page ya que el home puede redirigir segun estado del backend
    await driver.wait(async () => {
      const u = await driver.getCurrentUrl();
      return u.includes('/home-page') || u.includes('/landing-page');
    }, NAV_TIMEOUT);
    const finalUrl = await driver.getCurrentUrl();
    expect(finalUrl.includes('/home-page') || finalUrl.includes('/landing-page')).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 6: En estado de error el div de exito no esta en el DOM - no requiere backend
  // Los bloques @if son mutuamente excluyentes
  // ──────────────────────────────────────────────────────────────
  it('Debe ocultar el div de exito cuando se muestra un estado de error', async () => {
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/payment/success');
    await sleep(2000);

    await waitVisible(driver, By.css('.error'));
    const successDivs = await driver.findElements(By.css('.success'));
    expect(successDivs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 7: El contenedor principal carga con token valido - no requiere backend
  // Verifica que la guarda permite el acceso y el componente se renderiza
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el contenedor principal al acceder a /payment/success con token valido', async () => {
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/payment/success');
    await sleep(2000);

    const containers = await driver.findElements(By.css('.status-container'));
    expect(containers.length).toBeGreaterThan(0);
    expect(await driver.getCurrentUrl()).not.toContain('/login');
  });
});
