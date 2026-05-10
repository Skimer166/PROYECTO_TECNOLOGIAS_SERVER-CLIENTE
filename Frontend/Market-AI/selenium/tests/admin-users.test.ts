// Tests E2E - Admin Users: Edit Credits Dialog (EC-01 a EC-16)
//                           Confirm Delete Dialog (CD-01 a CD-03)
import { WebDriver, By, until } from 'selenium-webdriver';
import { createDriver } from '../browser-factory';
import {
  APP_URL,
  TIMEOUT,
  NAV_TIMEOUT,
  FAKE_ADMIN_TOKEN,
  setToken,
  clearToken,
  waitVisible,
  waitForEl,
  sleep,
} from '../helpers';

const BACKEND_URL = process.env['BACKEND_URL'] || 'http://localhost:3001';

describe('Admin Users - Dialogs (E2E)', () => {
  let driver: WebDriver;
  let backendAvailable = false;
  // Se activa solo si el backend carga la lista de usuarios con el token actual
  let hasAdminAccess = false;

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

    // Verificar acceso admin usando pushState para evitar redireccion SSR
    if (backendAvailable) {
      await driver.get(APP_URL + '/landing-page');
      await sleep(1000);
      await setToken(driver, FAKE_ADMIN_TOKEN);
      await driver.executeScript(`
        history.pushState(null, '', '/admin/users');
        window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
      `);
      await sleep(3000);
      const rows = await driver.findElements(By.css('.user-row:not(.user-row--header)'));
      hasAdminAccess = rows.length > 0;
    }
    console.log(`Acceso admin con lista de usuarios: ${hasAdminAccess}\n`);

    await driver.get(APP_URL + '/landing-page');
    await clearToken(driver);
  }, 60_000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  // Helper: navega a /admin/users con token de admin via pushState (evita redireccion SSR)
  async function goToAdminUsers(): Promise<void> {
    const currentUrl = await driver.getCurrentUrl().catch(() => '');
    if (!currentUrl.startsWith(APP_URL)) {
      await driver.get(APP_URL + '/landing-page');
      await sleep(1000);
    }

    await driver.executeScript(`
      history.pushState(null, '', '/landing-page');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);
    await sleep(300);

    await setToken(driver, FAKE_ADMIN_TOKEN);

    await driver.executeScript(`
      history.pushState(null, '', '/admin/users');
      window.dispatchEvent(new PopStateEvent('popstate', { state: history.state }));
    `);

    await driver.wait(
      async () => (await driver.getCurrentUrl()).includes('/admin/users'),
      NAV_TIMEOUT
    );
    await sleep(2500);
  }

  // Helper: abre el dialog de edicion de creditos del primer usuario de la lista
  async function openCreditsDialog(): Promise<void> {
    await goToAdminUsers();
    const editBtn = await waitVisible(driver, By.css('.credits-edit-btn'));
    await editBtn.click();
    await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
    await sleep(300);
  }

  // Helper: abre el dialog de confirmacion de eliminacion del primer usuario
  async function openDeleteDialog(): Promise<void> {
    await goToAdminUsers();
    const deleteBtn = await waitVisible(driver, By.css('.user-btn-delete'));
    await deleteBtn.click();
    await driver.wait(until.elementLocated(By.css('mat-dialog-container')), TIMEOUT);
    await sleep(300);
  }

  // ══════════════════════════════════════════════════════════════
  // EDIT CREDITS DIALOG (EC-01 a EC-16)
  // ══════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-01: Dialog abre y muestra input para monto [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir el dialog de edicion de creditos al hacer clic en el boton de editar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-01: sin acceso admin'); return; }
    await openCreditsDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    expect(await dialog.isDisplayed()).toBe(true);

    const dialogText = await dialog.getText();
    expect(dialogText).toContain('Agregar');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-02: Guardar con monto valido cierra el dialog [BE+admin]
  // El dialog solo cierra con el valor; el PUT lo hace el componente padre
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar el dialog al confirmar con un monto valido', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-02: sin acceso admin'); return; }
    await openCreditsDialog();

    const input = await waitVisible(driver, By.css('mat-dialog-container input[type="number"]'));
    await input.clear();
    await input.sendKeys('100');
    await sleep(300);

    const saveBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Guardar")]')
    );
    await driver.wait(async () => (await saveBtn.getAttribute('disabled')) === null, TIMEOUT);
    await saveBtn.click();
    await sleep(500);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-03: Cancelar cierra el dialog sin guardar [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar el dialog de creditos al hacer clic en Cancelar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-03: sin acceso admin'); return; }
    await openCreditsDialog();

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
    );
    await cancelBtn.click();
    await sleep(500);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-04: El dialog tiene un titulo visible [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el titulo Agregar creditos en el dialog', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-04: sin acceso admin'); return; }
    await openCreditsDialog();

    const title = await driver.findElement(By.css('mat-dialog-container h2'));
    const text = await title.getText();
    expect(text.length).toBeGreaterThan(0);
    expect(text.toLowerCase()).toContain('agregar');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-05: El input es de tipo number [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el input del dialog con type="number"', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-05: sin acceso admin'); return; }
    await openCreditsDialog();

    const input = await driver.findElement(By.css('mat-dialog-container input'));
    expect(await input.getAttribute('type')).toBe('number');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-06: El input tiene un label descriptivo [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el label Cantidad a agregar en el dialog', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-06: sin acceso admin'); return; }
    await openCreditsDialog();

    const label = await driver.findElement(By.css('mat-dialog-container mat-label'));
    const text = await label.getText();
    expect(text.toLowerCase()).toContain('cantidad');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-07: El dialog tiene exactamente 2 botones [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener exactamente 2 botones en el dialog de creditos', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-07: sin acceso admin'); return; }
    await openCreditsDialog();

    const buttons = await driver.findElements(
      By.css('mat-dialog-container mat-dialog-actions button')
    );
    expect(buttons.length).toBe(2);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-08: El boton confirmar tiene texto afirmativo [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton confirmar con texto Guardar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-08: sin acceso admin'); return; }
    await openCreditsDialog();

    const saveBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Guardar")]')
    );
    expect(await saveBtn.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-09: El boton cancelar tiene texto de cancelacion [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener el boton cancelar con texto Cancelar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-09: sin acceso admin'); return; }
    await openCreditsDialog();

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
    );
    expect(await cancelBtn.isDisplayed()).toBe(true);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-10: El input acepta valores numericos positivos [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe aceptar el valor 500 en el input sin error de validacion', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-10: sin acceso admin'); return; }
    await openCreditsDialog();

    const input = await waitVisible(driver, By.css('mat-dialog-container input[type="number"]'));
    await input.clear();
    await input.sendKeys('500');
    await sleep(300);

    expect(await input.getAttribute('value')).toBe('500');
    const errors = await driver.findElements(By.css('mat-dialog-container mat-error'));
    expect(errors.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-11: El boton confirmar se habilita con valor valido [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe habilitar el boton Guardar al ingresar un monto positivo', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-11: sin acceso admin'); return; }
    await openCreditsDialog();

    const input = await waitVisible(driver, By.css('mat-dialog-container input[type="number"]'));
    await input.clear();
    await input.sendKeys('100');
    await sleep(300);

    const saveBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Guardar")]')
    );
    await driver.wait(async () => (await saveBtn.getAttribute('disabled')) === null, TIMEOUT);
    expect(await saveBtn.getAttribute('disabled')).toBeNull();
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-12: El dialog tiene backdrop visible [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el overlay backdrop cuando el dialog esta abierto', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-12: sin acceso admin'); return; }
    await openCreditsDialog();

    const backdrops = await driver.findElements(By.css('.cdk-overlay-backdrop'));
    expect(backdrops.length).toBeGreaterThan(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-13: El dialog esta centrado en la pantalla [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe mostrar el dialog centrado horizontalmente en el viewport', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-13: sin acceso admin'); return; }
    await openCreditsDialog();

    const offset = await driver.executeScript(`
      const el = document.querySelector('mat-dialog-container');
      if (!el) return 999;
      const r = el.getBoundingClientRect();
      const center = r.left + r.width / 2;
      return Math.abs(center - window.innerWidth / 2);
    `) as number;
    expect(offset).toBeLessThan(100);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-14: Cancelar no ejecuta ninguna accion de guardado [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar el dialog sin guardar al cancelar incluso con monto ingresado', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-14: sin acceso admin'); return; }
    await openCreditsDialog();

    const input = await waitVisible(driver, By.css('mat-dialog-container input[type="number"]'));
    await input.clear();
    await input.sendKeys('999');
    await sleep(200);

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
    );
    await cancelBtn.click();
    await sleep(500);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-15: El dialog tiene role="dialog" [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe tener role="dialog" en el contenedor del dialog de creditos', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-15: sin acceso admin'); return; }
    await openCreditsDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    const role = await dialog.getAttribute('role');
    expect(role).toBe('dialog');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA EC-16: El dialog se puede abrir y cerrar 3 veces sin errores [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir y cerrar el dialog de creditos 3 veces sin errores', async () => {
    if (!hasAdminAccess) { console.warn('SKIP EC-16: sin acceso admin'); return; }
    await goToAdminUsers();

    for (let i = 0; i < 3; i++) {
      const editBtn = await waitVisible(driver, By.css('.credits-edit-btn'));
      await editBtn.click();
      await waitForEl(driver, By.css('mat-dialog-container'));
      await sleep(300);

      const dialog = await driver.findElement(By.css('mat-dialog-container'));
      expect(await dialog.isDisplayed()).toBe(true);

      const cancelBtn = await driver.findElement(
        By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
      );
      await cancelBtn.click();
      await sleep(500);

      const dialogs = await driver.findElements(By.css('mat-dialog-container'));
      expect(dialogs.length).toBe(0);
    }
  });

  // ══════════════════════════════════════════════════════════════
  // CONFIRM DELETE DIALOG (CD-01 a CD-03)
  // ══════════════════════════════════════════════════════════════

  // ──────────────────────────────────────────────────────────────
  // PRUEBA CD-01: Dialog de confirmacion abre al hacer clic en Eliminar [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe abrir el dialog de confirmacion al hacer clic en Eliminar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-01: sin acceso admin'); return; }
    await openDeleteDialog();

    const dialog = await driver.findElement(By.css('mat-dialog-container'));
    expect(await dialog.isDisplayed()).toBe(true);

    const dialogText = await dialog.getText();
    expect(dialogText.toLowerCase()).toContain('eliminar');
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA CD-02: Click en Cancelar cierra el dialog sin eliminar [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe cerrar el dialog de confirmacion al hacer clic en Cancelar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-02: sin acceso admin'); return; }
    await openDeleteDialog();

    const cancelBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"Cancelar")]')
    );
    await cancelBtn.click();
    await sleep(500);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────
  // PRUEBA CD-03: Click en "Si, eliminar" confirma y cierra el dialog [BE+admin]
  // ──────────────────────────────────────────────────────────────
  it('Debe confirmar y cerrar el dialog al hacer clic en Si eliminar', async () => {
    if (!hasAdminAccess) { console.warn('SKIP CD-03: sin acceso admin'); return; }
    await openDeleteDialog();

    const confirmBtn = await driver.findElement(
      By.xpath('//mat-dialog-container//button[contains(.,"eliminar")]')
    );
    await confirmBtn.click();
    await sleep(1000);

    const dialogs = await driver.findElements(By.css('mat-dialog-container'));
    expect(dialogs.length).toBe(0);
  });
});
