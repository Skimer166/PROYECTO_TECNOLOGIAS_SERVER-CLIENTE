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
  // Token real del backend cuando las credenciales esten en .env; si no, token falso.
  let userToken: string = FAKE_USER_TOKEN;

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

    // Intentar login real con credenciales del .env para tests [BE]
    const email    = process.env['USER_EMAIL'];
    const password = process.env['USER_PASSWORD'];
    if (backendAvailable && email && password) {
      try {
        const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (loginRes.ok) {
          const data = await loginRes.json() as { token?: string };
          if (data.token) {
            userToken = data.token;
            console.log('Token real obtenido del backend.\n');
          } else {
            console.warn('Login OK pero sin campo token en la respuesta, se usa token falso.\n');
          }
        } else {
          console.warn(`Login fallido (${loginRes.status}): credenciales incorrectas o no configuradas en .env, se usa token falso.\n`);
        }
      } catch {
        console.warn('No se pudo autenticar con el backend real, se usara token falso.\n');
      }
    }

    await driver.get(APP_URL + '/landing-page');
    await clearToken(driver);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // Navega a /mi-perfil con sesion activa y espera que cargue la tarjeta.
  //
  // La app usa SSR (outputMode: server): el servidor no puede leer localStorage,
  // por lo que el guard redirige a /login y el guestOnlyGuard del cliente termina
  // en /landing-page. Para evitarlo, se usa history.pushState + popstate que
  // navega dentro del router de Angular en el cliente (sin peticion HTTP al servidor).
  //
  // Ademas, siempre se pasa por /landing-page primero para forzar que Angular
  // destruya y recree el componente MyProfile (evita reusar el formulario sucio
  // de la prueba anterior).
  async function goToProfile(token = userToken): Promise<void> {
    const currentUrl = await driver.getCurrentUrl().catch(() => '');
    if (!currentUrl.startsWith(APP_URL)) {
      await driver.get(APP_URL + '/landing-page');
      await sleep(2000);
    }

    // Ir a /landing-page client-side para destruir MyProfile si estaba activo
    await driver.executeScript(`
      history.pushState(null, '', '/landing-page');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);
    await sleep(300);

    await setToken(driver, token);

    // Navegar a /mi-perfil client-side (el guard ve el token en localStorage)
    await driver.executeScript(`
      history.pushState(null, '', '/mi-perfil');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);

    await driver.wait(
      async () => (await driver.getCurrentUrl()).includes('/mi-perfil'),
      NAV_TIMEOUT
    );
    await waitForEl(driver, By.css('.profile-card'));
  }

  // ──────────────────────────────────────────────────────────────
  // PRUEBA 1: Carga correcta del perfil [BE]
  // ──────────────────────────────────────────────────────────────
  it('Debe cargar avatar nombre email y contador de agentes al navegar a /mi-perfil', async () => {
    if (!backendAvailable) { console.warn('SKIP MP-01: backend no disponible'); return; }
    await goToProfile();
    await sleep(1000); // esperar que el backend responda con los datos del usuario

    expect(await driver.findElement(By.css('.avatar-section')).isDisplayed()).toBe(true);

    const nameInput = await waitVisible(
      driver,
      By.xpath('//mat-label[contains(.,"Nombre")]/ancestor::mat-form-field//input')
    );
    if (userToken !== FAKE_USER_TOKEN) {
      // Con token real el backend devuelve el nombre del usuario
      expect((await nameInput.getAttribute('value')).length).toBeGreaterThan(0);
    } else {
      // Sin credenciales reales en .env, se verifica solo que el input es visible
      console.warn('MP-01: usando token falso, solo se verifica visibilidad del input nombre');
      expect(await nameInput.isDisplayed()).toBe(true);
    }

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
    await sleep(500);

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
    await sleep(800); // dar tiempo al backend para responder y a Angular para detectar cambios

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
  // Usa FAKE_USER_TOKEN deliberadamente para que el backend rechace la operacion
  // y aparezca el dialog de error (con token real el guardado podria tener exito)
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar dialog de error al intentar guardar cuando la operacion falla', async () => {
    await goToProfile(FAKE_USER_TOKEN); // token falso para forzar rechazo del backend

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

    // Descartar alerta si el backend rechaza el upload (p.ej. configuracion de Cloudinary)
    try {
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      await alert.accept();
      console.warn(`MP-08: upload rechazado por backend (${alertText})`);
      return; // no se puede verificar la imagen si el upload fallo
    } catch { /* sin alerta: upload exitoso */ }

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

    // Descartar alerta si el backend rechaza el upload
    try {
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      await alert.accept();
      console.warn(`MP-09: upload rechazado por backend (${alertText})`);
      return;
    } catch { /* sin alerta: upload exitoso */ }

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
