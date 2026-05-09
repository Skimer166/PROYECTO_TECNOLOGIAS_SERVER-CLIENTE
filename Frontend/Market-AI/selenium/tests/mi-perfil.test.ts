// Tests E2E - Mi Perfil (MP-01 a MP-13)
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
  waitForEl,
  waitForUrl,
  sleep,
} from '../helpers';

const BACKEND_URL = process.env['BACKEND_URL'] || 'http://localhost:3001';

describe('Mi Perfil (E2E)', () => {
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

  // Navega a /mi-perfil con sesion activa y espera que cargue la tarjeta
  async function goToProfile(): Promise<void> {
    await setToken(driver, FAKE_USER_TOKEN);
    await driver.get(APP_URL + '/mi-perfil');
    // Esperar a que la URL se estabilice (guard puede redirigir a /login)
    await driver.wait(async () => {
      const u = await driver.getCurrentUrl();
      return u.includes('/mi-perfil') || u.includes('/login');
    }, NAV_TIMEOUT);
    const url = await driver.getCurrentUrl();
    if (url.includes('/login')) {
      throw new Error(
        'goToProfile: redirigido a /login — token rechazado por atob().' +
        ' Si acabas de modificar helpers.ts, limpia la cache: ' +
        'npx jest --config jest.e2e.config.js --no-cache mi-perfil'
      );
    }
    // Esperar que el div principal este en el DOM (presencia, sin requisito de visibilidad)
    await waitForEl(driver, By.css('.profile-card'));
  }

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 1: Carga correcta del perfil [BE]
  // ──────────────────────────────────────────────────────────────
  it('Debe cargar avatar nombre email y contador de agentes al navegar a /mi-perfil', async () => {
    if (!backendAvailable) { console.warn('SKIP MP-01: backend no disponible'); return; }
    await goToProfile();

    expect(await driver.findElement(By.css('.avatar-section')).isDisplayed()).toBe(true);

    const nameInput = await waitVisible(
      driver,
      By.xpath('//mat-label[contains(.,"Nombre")]/ancestor::mat-form-field//input')
    );
    expect((await nameInput.getAttribute('value')).length).toBeGreaterThan(0);

    expect(await driver.findElement(By.css('.stats-row')).isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 2: Campo email no es editable - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el campo email deshabilitado y no aceptar input', async () => {
    await goToProfile();

    const emailInput = await waitVisible(
      driver,
      By.xpath('//mat-label[contains(.,"Correo")]/ancestor::mat-form-field//input')
    );

    const isDisabled = await emailInput.getAttribute('disabled');
    const isReadonly = await emailInput.getAttribute('readonly');
    expect(isDisabled !== null || isReadonly !== null).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 3: Edicion de nombre exitosa [BE]
  // ──────────────────────────────────────────────────────────────
  it('Debe guardar el nuevo nombre y mostrar notificacion de exito', async () => {
    if (!backendAvailable) { console.warn('SKIP MP-03: backend no disponible'); return; }
    await goToProfile();

    const nameInput = await waitVisible(
      driver,
      By.xpath('//mat-label[contains(.,"Nombre")]/ancestor::mat-form-field//input')
    );
    await nameInput.clear();
    await nameInput.sendKeys('Victoria Test');

    const saveBtn = await driver.findElement(By.css('.actions button[type="submit"]'));
    await saveBtn.click();

    await driver.wait(
      until.elementLocated(By.css('mat-dialog-container, mat-snack-bar-container')),
      TIMEOUT
    );
    const notif = await driver.findElement(
      By.css('mat-dialog-container, mat-snack-bar-container')
    );
    expect(await notif.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 4: Boton Guardar deshabilitado si formulario no cambio [BE]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton Guardar deshabilitado cuando el formulario no ha sido modificado', async () => {
    if (!backendAvailable) { console.warn('SKIP MP-04: backend no disponible'); return; }
    await goToProfile();
    await sleep(500);

    const saveBtn = await driver.findElement(By.css('.actions button[type="submit"]'));
    expect(await saveBtn.getAttribute('disabled')).not.toBeNull();
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 5: Boton Guardar deshabilitado si nombre invalido - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe deshabilitar el boton Guardar cuando el nombre tiene menos de 2 caracteres', async () => {
    await goToProfile();

    const nameInput = await waitVisible(
      driver,
      By.xpath('//mat-label[contains(.,"Nombre")]/ancestor::mat-form-field//input')
    );
    await nameInput.clear();
    await nameInput.sendKeys('A');

    const saveBtn = await driver.findElement(By.css('.actions button[type="submit"]'));
    expect(await saveBtn.getAttribute('disabled')).not.toBeNull();
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 6: Error al guardar cuando el guardado falla
  // Funciona con backend prendido (rechaza el token falso) o apagado (sin conexion)
  // en ambos casos la operacion de guardado falla y debe aparecer el dialog de error
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar dialog de error al intentar guardar cuando la operacion falla', async () => {
    await goToProfile();

    const nameInput = await waitVisible(
      driver,
      By.xpath('//mat-label[contains(.,"Nombre")]/ancestor::mat-form-field//input')
    );
    await nameInput.clear();
    await nameInput.sendKeys('Victoria Test');

    const saveBtn = await driver.findElement(By.css('.actions button[type="submit"]'));
    await saveBtn.click();

    await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
    expect(
      await driver.findElement(By.css('mat-dialog-container')).isDisplayed()
    ).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 7: Clic en avatar activa el input de archivo - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe existir el input de archivo y activarse al hacer clic en el avatar', async () => {
    await goToProfile();

    const avatarWrapper = await waitVisible(driver, By.css('.avatar-wrapper'));

    const fileInput = await driver.findElement(By.id('avatarInput'));
    expect(await fileInput.getAttribute('type')).toBe('file');
    expect(await fileInput.getAttribute('accept')).toBe('image/*');

    await avatarWrapper.click();
    await sleep(300);
    // El input sigue accesible tras el clic sin errores
    expect(await fileInput.getAttribute('type')).toBe('file');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 8: Upload de avatar exitoso [BE]
  // Requiere TEST_IMAGE_PATH en .env apuntando a una imagen de prueba
  // ──────────────────────────────────────────────────────────────
  it('Debe actualizar el avatar visualmente al subir una imagen valida', async () => {
    if (!backendAvailable) { console.warn('SKIP MP-08: backend no disponible'); return; }
    const testImagePath = process.env['TEST_IMAGE_PATH'] || '';
    if (!testImagePath) { console.warn('SKIP MP-08: TEST_IMAGE_PATH no configurado en .env'); return; }

    await goToProfile();

    await driver.executeScript(
      `document.getElementById('avatarInput').removeAttribute('hidden')`
    );
    const fileInput = await driver.findElement(By.id('avatarInput'));
    await fileInput.sendKeys(testImagePath);
    await sleep(2000);

    const avatarImg = await driver.findElements(By.css('.avatar-wrapper img'));
    expect(avatarImg.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 9: Preview del avatar se actualiza inmediatamente [BE]
  // Requiere TEST_IMAGE_PATH en .env apuntando a una imagen de prueba
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar preview del nuevo avatar al seleccionar el archivo', async () => {
    if (!backendAvailable) { console.warn('SKIP MP-09: backend no disponible'); return; }
    const testImagePath = process.env['TEST_IMAGE_PATH'] || '';
    if (!testImagePath) { console.warn('SKIP MP-09: TEST_IMAGE_PATH no configurado en .env'); return; }

    await goToProfile();

    const beforeImgs = await driver.findElements(By.css('.avatar-wrapper img'));
    const beforeSrc = beforeImgs.length > 0 ? await beforeImgs[0].getAttribute('src') : '';

    await driver.executeScript(
      `document.getElementById('avatarInput').removeAttribute('hidden')`
    );
    const fileInput = await driver.findElement(By.id('avatarInput'));
    await fileInput.sendKeys(testImagePath);
    await sleep(1000);

    const afterImgs = await driver.findElements(By.css('.avatar-wrapper img'));
    expect(afterImgs.length).toBeGreaterThan(0);
    const afterSrc = await afterImgs[0].getAttribute('src');
    expect(afterSrc).not.toBe(beforeSrc);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 10: Hover sobre avatar muestra overlay de edicion - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el overlay de edicion al hacer hover sobre el avatar', async () => {
    await goToProfile();

    const avatarWrapper = await waitVisible(driver, By.css('.avatar-wrapper'));

    await driver.actions().move({ origin: avatarWrapper }).perform();
    await sleep(500);

    const overlayOpacity = await driver.executeScript(
      `return window.getComputedStyle(document.querySelector('.avatar-overlay')).opacity`
    ) as string;
    expect(parseFloat(overlayOpacity)).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 11: Contador de agentes rentados se muestra [BE]
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el numero de agentes rentados en la seccion de estadisticas', async () => {
    if (!backendAvailable) { console.warn('SKIP MP-11: backend no disponible'); return; }
    await goToProfile();
    await sleep(1000);

    const statValues = await driver.findElements(By.css('.stat-item .value'));
    expect(statValues.length).toBeGreaterThan(0);

    const countText = await statValues[0].getText();
    expect(/^\d+$/.test(countText)).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 12: Estado "Activo" visible en estadisticas - no requiere backend
  // Nota: el texto "Activo" es estatico en el template del componente
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el estado Activo en la seccion de estadisticas', async () => {
    await goToProfile();
    await sleep(500);

    const statsRow = await waitVisible(driver, By.css('.stats-row'));
    const statsText = await statsRow.getText();
    expect(statsText).toContain('Activo');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 13: Usuario no autenticado redirigido a /login - no requiere backend
  // ──────────────────────────────────────────────────────────────
  it('Debe redirigir a /login al navegar a /mi-perfil sin token', async () => {
    await clearToken(driver);
    await driver.get(APP_URL + '/mi-perfil');
    await waitForUrl(driver, '/login', NAV_TIMEOUT);
    expect(await driver.getCurrentUrl()).toContain('/login');
  });
});
